# Control Room Plus

A new version of the Django application with:
- Diary
- Personal Finance Manager
- Movies Collection
- TV Shows Collection

The application will be built in Next.js (Typescript) both the backend and the frontend.

Like the Django counterpart the user will be able to register and login to his personal page with access to his personal Diary, a personal Finance Manager that can help managing the expenses and incomes.
Plus there will be the usual pages to take a look at the Plex Media Library

## TODO:
- Personal Finance Manager
	- A tool that can help manage the user personal finances
	- A way to keep track of the fixed monthly expenses
	- Plus the ability to add any type of transaction (of type Expense or Income)
	- Fox each month the ability to print or save as PDF a report with all the transactions
- Therapy Session Notes
	- A tool that can help manage thoughts and ideas to share to your therapist
	- The user can save the note with the date of the next session
	- Note model:
		- content
		- therapy date
	- Both the fields of the Note model can be edited.
