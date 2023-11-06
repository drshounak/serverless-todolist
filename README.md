# serverless-todolist
This is a serverless todolist application for personal use deployed using cloudflare workers and KV database. It is a modified version of the todo-list template given with cloudflare workers.

Detailed Explanation [Blog Post Here](https://smartgoat.me).
## features
* CRUD with edit and priority tag
* Have a backend, so multi device use. You can even share it with close team.
* Password Protection using Octauthent
* Get Email with your todolist
## Technology Used:
* Cloudflare Workers
* Cloudflare KV database
* Octauthent (also uses cloudflare workers)
* Mailgun (for email)
* Google Cloud Scheduler (for automate email sending process)
## Requirments
* Your Own Domain Name
* Cloudflare Account (Free Tier)
* Mailgun Account (Free Tier - Flex Plan)
* Google Cloud Account (3 Scheduler free)

Post about Detailed Deployment [Here](https://smartgoat.me/)

