const expenseForm = document.getElementById('expense-form');
const expenseInput = document.getElementById('expense-input');
const amountInput = document.getElementById('amount-input');
const incomeAmountInput = document.getElementById('income-amount');
const categoryInput = document.getElementById('category-input');
const transactionList = document.getElementById('transaction-list');
const totalExpense = document.getElementById('total-expenses');
const totalIncome = document.getElementById('total-income');
const balance = document.getElementById('balance');

function clearInputs() {
    expenseInput.value = '';
    amountInput.value = '';
    categoryInput.value = 'Expense';
}

function addIncome() {
    const description = document.getElementById('income-description').value.trim();
    const amount = parseFloat(document.getElementById('income-amount').value.trim());

    if (description === '' || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid income description and amount.');
        return;
    }

    addTransaction(description, amount, null, 'Income');
    // updateSummary();
    clearInputs();
}

function addExpense() {
    const description = expenseInput.value.trim();
    const amount = parseFloat(amountInput.value.trim());
    const category = categoryInput.value;

    if (description === '' || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid expense description and amount.');
        return;
    }

    addTransaction(description, amount, category, 'Expense');
    // updateSummary();
    clearInputs(); // Clears the input fields
}

function clearAll() {
    // Clear transactions from localStorage
    localStorage.removeItem('transactions');
    
    // Clear the transaction list in the DOM
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = '';

    // Reset the summary values
    const totalIncome = document.getElementById('total-income');
    const totalExpense = document.getElementById('total-expenses');
    const balance = document.getElementById('balance');
    
    totalIncome.textContent = '0.00';
    totalExpense.textContent = '0.00';
    balance.textContent = '0.00';

    // Notify the user
    showNotification('All transactions cleared!');
}

function showNotification(message) {
    alert(message);
}

// Attach to the window object for debugging if necessary
window.clearAll = clearAll;


expenseForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const description = expenseInput.value.trim();
    const amount = parseFloat(amountInput.value.trim());
    const category = categoryInput.value;

    if (description === '' || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid expense description and amount.');
        return;
    }

    addTransaction(description, amount, category);
    // updateSummary();
    clearInputs();
// Call updateSummary on page load to update the UI with any existing transactions
document.addEventListener('DOMContentLoaded', updateSummary);
});

// function addTransaction(description, amount, category) {
//     const date = new Date().toLocaleDateString(); // Current date in dd/mm/yyyy format
//     const transaction = {
//         description: description,
//         amount: amount,
//         category: category,
//         date: date,
//     };

//     let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
//     transactions.push(transaction);
//     localStorage.setItem('transactions', JSON.stringify(transactions));

//     const transactionRow = document.createElement('tr');
//     transactionRow.innerHTML = `
//         <td>${description}</td>
//         <td>${category}</td>
//         <td>${amount.toFixed(2)}</td>
//         <td>${category === 'Income' ? 'Income' : 'Expense'}</td>
//         <td>${transaction.date}</td> 
//         <td><button class="delete-btn"><i class="fas fa-trash"></i></button></td>
//     `;

//     transactionList.appendChild(transactionRow);

//     transactionRow.querySelector('.delete-btn').addEventListener('click', function () {
//         transactionRow.remove();
//         removeTransaction(transaction);
//         updateSummary();
//     });
    
// }

async function addTransaction(description, amount, category, type) {
    const response = await fetch('/add_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, amount, category: category || '', type })
    });

    if (response.ok) {
        loadTransactions(); // Refresh the list after adding
    } else {
        alert('Failed to add transaction');
    }
}



// function removeTransaction(transactionToRemove) {
//     let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
//     transactions = transactions.filter(transaction => (
//         transaction.description !== transactionToRemove.description ||
//         transaction.amount !== transactionToRemove.amount ||
//         transaction.category !== transactionToRemove.category
//     ));
//     localStorage.setItem('transactions', JSON.stringify(transactions));
// }

// function updateSummary() {
//     let totalExpenses = 0;
//     let totalIncomes = 0;

//     const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

//     transactions.forEach(function (transaction) {
//         if (transaction.category === 'Income') {
//             totalIncomes += transaction.amount;
//         } else {
//             totalExpenses += transaction.amount;
//         }
//     });

//     // Update UI
//     totalExpense.textContent = totalExpenses.toFixed(2);
//     totalIncome.textContent = totalIncomes.toFixed(2);
//     balance.textContent = (totalIncomes - totalExpenses).toFixed(2);

//     // Balance formatting
//     balance.classList.toggle('positive', totalIncomes >= totalExpenses);
//     balance.classList.toggle('negative', totalIncomes < totalExpenses);
// }

async function loadTransactions() {
    const response = await fetch('/get_transactions');
    const data = await response.json();

    if (data.transactions) {
        const transactions = data.transactions;
        transactionList.innerHTML = ''; // Clear the table

        let totalIncomes = 0;
        let totalExpenses = 0;

        transactions.forEach(transaction => {
            const { description, amount, category, type, date } = transaction;
            const transactionRow = document.createElement('tr');
            transactionRow.innerHTML = `
                <td>${description}</td>
                <td>${category}</td>
                <td>${parseFloat(amount).toFixed(2)}</td>
                <td>${type}</td>
                <td>${new Date(date).toLocaleDateString()}</td>
                <td><button class="delete-btn"><i class="fas fa-trash"></i></button></td>
            `;
            transactionList.appendChild(transactionRow);

            if (type === 'Income') totalIncomes += parseFloat(amount);
            else totalExpenses += parseFloat(amount);

            transactionRow.querySelector('.delete-btn').addEventListener('click', () => {
                deleteTransaction(transaction.id);
            });
        });

        // Update summary
        totalIncome.textContent = totalIncomes.toFixed(2);
        totalExpense.textContent = totalExpenses.toFixed(2);
        balance.textContent = (totalIncomes - totalExpenses).toFixed(2);
    }
}

document.addEventListener('DOMContentLoaded', loadTransactions);


async function deleteTransaction(transactionId) {
    const response = await fetch(`/delete_transaction/${transactionId}`, { method: 'DELETE' });

    if (response.ok) {
        loadTransactions(); // Refresh the list after deleting
    } else {
        alert('Failed to delete transaction');
    }
}

