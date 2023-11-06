import { escapeHtml } from './escape.js';
import template from './template.html';

const defaultData = { todos: [] };

async function setCache(key, data, env) {
  await env.EXAMPLE_TODOS.put(key, data);
}

async function getCache(key, env) {
  return await env.EXAMPLE_TODOS.get(key);
}

async function getTodos(request, env) {
  const url = new URL(request.url);
  const cacheKey = `data-${url.hostname}`;
  let data;
  const cache = await getCache(cacheKey, env);
  if (!cache) {
    await setCache(cacheKey, JSON.stringify(defaultData), env);
    data = defaultData;
  } else {
    data = JSON.parse(cache);
  }

  const body = template.replace(
    '$TODOS',
    JSON.stringify(
      data.todos?.map(todo => ({
        id: escapeHtml(todo.id),
        name: escapeHtml(todo.name),
        completed: !!todo.completed,
        priority: escapeHtml(todo.priority)
      })) ?? []
    )
  );
  return new Response(body, {
    headers: { 'Content-Type': 'text/html' }
  });
}

async function updateTodos(request, env) {
  const url = new URL(request.url);
  const body = await request.text();
  const cacheKey = `data-${url.hostname}`;
  try {
    JSON.parse(body);
    await setCache(cacheKey, body, env);
    return new Response(body, { status: 200 });
  } catch (err) {
    return new Response(err, { status: 500 });
  }
}

function createHtmlTableFromJson(jsonData) {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  const dateTimeString = `<div style="text-align: center; font-weight: bold; color: #5386ed; font-size: 20px; margin-bottom: 20px;">🕒 Sent at: ${istTime.toLocaleString()}</div>`;

  let table = `<table style="width:100%; border:1px solid black; border-collapse: collapse; font-size: 16px;">
  <thead style="background-color: #d3d3d3; color: black;">
    <tr>
      <th style="padding: 15px; border: 1px solid black;">ID</th>
      <th style="padding: 15px; border: 1px solid black;">Name</th>
      <th style="padding: 15px; border: 1px solid black;">Completed</th>
      <th style="padding: 15px; border: 1px solid black;">Priority</th>
    </tr>
  </thead>
  <tbody>`;

  jsonData.todos.forEach((todo, index) => {
    let rowColor = index % 2 === 0 ? '#f2f2f2' : '#ffffff';
    let completedColor = todo.completed ? 'green' : 'red';
    let priorityColor = '';
    if (todo.priority === 'high') {
      priorityColor = 'red';
    } else if (todo.priority === 'mid') {
      priorityColor = 'orange';
    } else {
      priorityColor = 'green';
    }

    table += `
    <tr style="background-color: ${rowColor};">
      <td style="padding: 15px; border: 1px solid black;">${escapeHtml(todo.id)}</td>
      <td style="padding: 15px; border: 1px solid black;">${escapeHtml(todo.name)}</td>
      <td style="padding: 15px; border: 1px solid black; color: ${completedColor};">${todo.completed ? 'Yes' : 'No'}</td>
      <td style="padding: 15px; border: 1px solid black; color: ${priorityColor};">${escapeHtml(todo.priority)}</td>
    </tr>`;
  });

  table += '</tbody></table>';
  return dateTimeString + table;
}


async function sendTodosByEmail(request, env) {
  const domain = new URL(request.url).hostname; // Get the domain from the request
  const cacheKey = `data-${domain}`;
  const data = await getCache(cacheKey, env);
  if (!data) {
    return new Response('No todos to send', { status: 404 });
  }

  // Convert the JSON data to HTML table
  const htmlTable = createHtmlTableFromJson(JSON.parse(data));

  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

  // Format the date and time as a string
  const dateTimeString = istTime.toLocaleString();

  // Append the date and time to the data
  const dataWithDateTime = `${htmlTable}\n\nSent at: ${dateTimeString}`;

  const mailgunUrl = `https://api.mailgun.net/v3/YOUR_DOMAIN_NAME/messages`;
  const response = await fetch(mailgunUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa('api:YOUR_MAILGUN_API_KEY')}`
    },
    body: new URLSearchParams({
      from: 'SENDER_EMAIL',
      to: 'RECIPIENT_EMAIL',
      html: dataWithDateTime, // use 'html' instead of 'text' to send HTML content
      subject: 'Your todos'
    })
  });

  if (!response.ok) {
    return new Response('Failed to send email', { status: 500 });
  }

  return new Response('Email sent successfully', { status: 200 });
}


async function handleRequest(request, env) {
  const url = new URL(request.url);
  if (request.method === 'POST' && url.pathname === '/send-email') {
    return sendTodosByEmail(request, env);
  } else if (request.method === 'GET') {
    return getTodos(request, env);
  } else if (request.method === 'PUT') {
    return updateTodos(request, env);
  } else {
    return new Response('Not found', { status: 404 });
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event))
});

export default {
  fetch: handleRequest
};
