// Configuration
const API_BASE = "https://libsys-9d2x.onrender.com";

// State
let state = {
    books: [],
    members: [],
    borrows: [],
    publishers: []
};

// Utility: Format Currency (Indian Rupee)
const formatCurrency = (amount) => {
    if(!amount) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

// Utility: Format Date
const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if(isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    }).format(date);
};

// UI Helpers
const showLoading = (containerId) => {
    document.getElementById(containerId).innerHTML = `
        <div class="loading-wrapper">
            <div class="spinner"></div>
            <p class="loading-text">Fetching records…</p>
        </div>
    `;
};

const showError = (containerId, message = "Could not reach the database. Ensure the server is running.") => {
    document.getElementById(containerId).innerHTML = `
        <div class="error-card">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h3>Connection Error</h3>
            <p>${message}</p>
        </div>
    `;
};

const showEmpty = (containerId, message = "No records found") => {
    document.getElementById(containerId).innerHTML = `
        <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <p>${message}</p>
        </div>
    `;
};

// Navigation & Sidebar Control Logic
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.page-section');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Mobile Sidebar toggle events
if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-open');
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        document.body.classList.remove('sidebar-open');
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const target = link.getAttribute('data-target');
        
        // Close sidebar drawer on mobile after clicking a link
        document.body.classList.remove('sidebar-open');
        
        // Update active link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Update active section
        sections.forEach(s => s.classList.remove('active'));
        const targetSection = document.getElementById(target);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Trigger specific logic when entering section
        if(target === 'dashboard') initDashboard();
        if(target === 'books') fetchBooks();
        if(target === 'members') fetchMembers();
        if(target === 'borrow') fetchBorrows();
        if(target === 'publishers') fetchPublishers();
    });
});

// API Fetchers
async function fetchAPI(endpoint) {
    try {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        throw error;
    }
} 

// Render Dashboard
async function initDashboard() {
    showLoading('recent-borrows-container');
    
    try {
        // We'll fetch all needed data for stats
        const [books, members, borrows] = await Promise.all([
            fetchAPI('/books').catch(() => []),
            fetchAPI('/members').catch(() => []),
            fetchAPI('/borrow').catch(() => [])
        ]);

        state.books = books;
        state.members = members;
        state.borrows = borrows;

        // Calc stats
        const totalBooks = books.length || 0;
        const totalMembers = members.length || 0;
        
        // Determine available vs borrowed based on the Available flag
        const availableBooks = books.filter(b => b.Available == true || b.Available == 1 || b.Available === 'Y' || String(b.Available).toLowerCase() === 'available').length || 0;
        
        // For borrowed, we count pending borrows
        const pendingBorrows = borrows.filter(b => !b.Return_date).length || 0;

        // Populate dashboard metrics
        document.getElementById('stat-books').textContent = totalBooks;
        document.getElementById('stat-members').textContent = totalMembers;
        document.getElementById('stat-borrowed').textContent = pendingBorrows;
        document.getElementById('stat-available').textContent = availableBooks;

        // Render recent 5 borrows
        renderRecentBorrows(borrows.slice(0, 5));

    } catch (err) {
        showError('recent-borrows-container');
        document.getElementById('stat-books').textContent = '-';
        document.getElementById('stat-members').textContent = '-';
        document.getElementById('stat-borrowed').textContent = '-';
        document.getElementById('stat-available').textContent = '-';
    }
}

function renderRecentBorrows(recent) {
    if(!recent || recent.length === 0) {
        showEmpty('recent-borrows-container', 'No recent transactions');
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Borrow ID</th>
                    <th>Member</th>
                    <th>Book Title</th>
                    <th>Issue Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    recent.forEach(row => {
        const isReturned = !!row.Return_date;
        let statusBadge = isReturned 
            ? `<span class="badge badge-success">Returned</span>`
            : `<span class="badge badge-warning">Pending</span>`;
        
        // Check overdue
        if(!isReturned && row.Due_date) {
            const due = new Date(row.Due_date);
            if(due < new Date()) {
                statusBadge = `<span class="badge badge-danger">Overdue</span>`;
            }
        }

        html += `
            <tr>
                <td class="mono-cell">#${String(row.Borrow_id || '').padStart(4, '0')}</td>
                <td class="primary-cell">${row.Member_Name || '-'}</td>
                <td>${row.Book_Title || '-'}</td>
                <td class="mono-cell">${formatDate(row.Issue_date)}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    document.getElementById('recent-borrows-container').innerHTML = html;
}

// Render Books
async function fetchBooks() {
    showLoading('books-container');
    try {
        const data = await fetchAPI('/books');
        state.books = data;
        document.getElementById('books-subtitle').textContent = `Total: ${data.length} books`;
        renderBooks(data);
    } catch (err) {
        showError('books-container');
    }
}

function renderBooks(data) {
    if(!data || data.length === 0) {
        showEmpty('books-container');
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Price</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(book => {
        const isAvail = book.Available == true || book.Available == 1 || book.Available === 'Y' || String(book.Available).toLowerCase() === 'available';
        const statusBadge = isAvail 
            ? `<span class="badge badge-success">Available</span>`
            : `<span class="badge badge-danger">Borrowed</span>`;

        html += `
            <tr>
                <td class="mono-cell">#${String(book.Book_id || '').padStart(4, '0')}</td>
                <td class="primary-cell">${book.Title || '-'}</td>
                <td>${book.Author_Name || '-'}</td>
                <td class="mono-cell">${formatCurrency(book.Price)}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    document.getElementById('books-container').innerHTML = html;
}

const booksSearch = document.getElementById('books-search');
if (booksSearch) {
    booksSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = state.books.filter(b => 
            (b.Title || '').toLowerCase().includes(term) || 
            (b.Author_Name || '').toLowerCase().includes(term)
        );
        renderBooks(filtered);
    });
}

// Render Members
async function fetchMembers() {
    showLoading('members-container');
    try {
        const data = await fetchAPI('/members');
        state.members = data;
        renderMembers(data);
    } catch (err) {
        showError('members-container');
    }
}

function renderMembers(data) {
    if(!data || data.length === 0) {
        showEmpty('members-container');
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Address</th>
                    <th>Join Date</th>
                    <th>Expiry Date</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(mem => {
        const isStudent = (mem.Memb_type || '').toLowerCase().includes('student');
        const badgeClass = isStudent ? 'badge-info' : 'badge-faculty';

        html += `
            <tr>
                <td class="mono-cell">#${String(mem.Memb_id || '').padStart(4, '0')}</td>
                <td class="primary-cell">${mem.Name || '-'}</td>
                <td><span class="badge ${badgeClass}">${mem.Memb_type || 'Unknown'}</span></td>
                <td>${mem.Address || '-'}</td>
                <td class="mono-cell">${formatDate(mem.Memb_date)}</td>
                <td class="mono-cell">${formatDate(mem.Expiry_date)}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    document.getElementById('members-container').innerHTML = html;
}

const membersSearch = document.getElementById('members-search');
if (membersSearch) {
    membersSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = state.members.filter(m => 
            (m.Name || '').toLowerCase().includes(term)
        );
        renderMembers(filtered);
    });
}

// Render Borrows
async function fetchBorrows() {
    showLoading('borrow-container');
    try {
        const data = await fetchAPI('/borrow');
        state.borrows = data;
        renderAllBorrows(data);
    } catch (err) {
        showError('borrow-container');
    }
}

function renderAllBorrows(data) {
    if(!data || data.length === 0) {
        showEmpty('borrow-container');
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Borrow ID</th>
                    <th>Member Name</th>
                    <th>Book Title</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    data.forEach(row => {
        const isReturned = !!row.Return_date;
        let statusBadge = isReturned 
            ? `<span class="badge badge-success">Returned</span>`
            : `<span class="badge badge-warning">Pending</span>`;
        
        if(!isReturned && row.Due_date) {
            const due = new Date(row.Due_date);
            if(due < new Date()) {
                statusBadge = `<span class="badge badge-danger">Overdue</span>`;
            }
        }

        html += `
            <tr>
                <td class="mono-cell">#${String(row.Borrow_id || '').padStart(4, '0')}</td>
                <td class="primary-cell">${row.Member_Name || '-'}</td>
                <td>${row.Book_Title || '-'}</td>
                <td class="mono-cell">${formatDate(row.Issue_date)}</td>
                <td class="mono-cell">${formatDate(row.Due_date)}</td>
                <td class="mono-cell">${row.Return_date ? formatDate(row.Return_date) : '-'}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    document.getElementById('borrow-container').innerHTML = html;
}

// Render Publishers
async function fetchPublishers() {
    showLoading('publishers-container');
    try {
        const data = await fetchAPI('/publishers');
        state.publishers = data;
        renderPublishers(data);
    } catch (err) {
        showError('publishers-container');
    }
}

function renderPublishers(data) {
    const container = document.getElementById('publishers-container');
    
    if(!data || data.length === 0) {
        showEmpty('publishers-container');
        container.style.display = 'block'; // override grid if empty
        return;
    }

    container.style.display = 'grid'; // ensure grid
    let html = '';

    data.forEach((pub, index) => {
        // Format ID like PUB · 001
        const pubIdNumber = pub.Pub_id || pub.Publisher_id || pub.id || (index + 1);
        const formattedId = `PUB · ${String(pubIdNumber).padStart(3, '0')}`;

        html += `
            <div class="pub-card">
                <div class="pub-id">${formattedId}</div>
                <div class="pub-name">${pub.Name || 'Unknown Publisher'}</div>
                <div class="pub-address">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>${pub.Address || 'No address provided'}</span>
                </div>
                <div class="pub-stats">
                    <span class="pub-stats-label">Books published</span>
                    <span class="pub-stats-value">
                        <span class="pub-count-num">${pub.book_count || pub.BookCount || 0}</span>
                        <span class="pub-count-unit">titles</span>
                    </span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Initial Load
window.addEventListener('DOMContentLoaded', () => {
    initDashboard();
});
