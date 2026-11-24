let complaints = JSON.parse(localStorage.getItem("hostelData")) || [];
let currentUser = sessionStorage.getItem("hostelUser") || "";

const $ = id => document.getElementById(id);

const stages = [
    "Registered",
    "Assigned",
    "In Progress",
    "Resolved"
];

// SAVE DATA
function saveData() {
    localStorage.setItem("hostelData", JSON.stringify(complaints));
}

// PREVENT HTML INJECTION
function safe(value) {
    return String(value).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

// 1. OPEN LOGIN SYSTEM

function login(username, password) {
    username = username.trim();

    if (username !== "" && password.trim() !== "") {
        currentUser = username;

        sessionStorage.setItem("hostelUser", username);

        $("loginPage").classList.add("hidden");
        $("app").classList.remove("hidden");

        $("displayUser").textContent = username;

        refreshWebsite();
        showPage("dashboard");
    } else {
        alert("Please enter username and password!");
    }
}

// LOGIN FORM
$("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    login(
        $("username").value,
        $("password").value
    );
});

// LOGOUT
$("logout").addEventListener("click", function() {
    sessionStorage.removeItem("hostelUser");
    currentUser = "";

    $("app").classList.add("hidden");
    $("loginPage").classList.remove("hidden");

    $("loginForm").reset();
});

// RESTORE LOGIN
if (currentUser) {
    $("loginPage").classList.add("hidden");
    $("app").classList.remove("hidden");

    $("displayUser").textContent = currentUser;
}

// 2. PAGE NAVIGATION

const pageTitles = {
    dashboard: "Dashboard",
    new: "New Complaint",
    complaints: "My Complaints",
    track: "Track Status",
    help: "Help & Support"
};

const subtitles = {
    dashboard: "Welcome to your student portal.",
    new: "Report a new hostel maintenance issue.",
    complaints: "Manage your submitted tickets.",
    track: "Check the progress of your complaint.",
    help: "We are here to help you."
};

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.toggle("active", section.id === page);
    });

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    $("pageTitle").textContent = pageTitles[page];
    $("subtitle").textContent = subtitles[page];

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// SIDEBAR NAVIGATION
document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

// DASHBOARD SHORTCUTS
document.querySelectorAll("[data-go]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.go);
    });
});

// 3. SUBMIT COMPLAINT

$("complaintForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const complaint = {
        id: "HC" + Date.now().toString().slice(-8),
        student: $("student").value.trim(),
        room: $("room").value.trim(),
        category: $("category").value,
        urgency: $("urgency").value,
        description: $("description").value.trim(),
        status: "Registered",
        date: new Date().toLocaleDateString()
    };

    if (
        !complaint.student ||
        !complaint.room ||
        !complaint.category ||
        !complaint.urgency ||
        !complaint.description
    ) {
        alert("Please complete all fields.");
        return;
    }

    complaints.unshift(complaint);

    saveData();
    this.reset();
    refreshWebsite();

    alert(
        "Complaint submitted successfully!\nTicket ID: " +
        complaint.id
    );

    showPage("complaints");
});

// 4. DISPLAY AND SEARCH COMPLAINTS

function displayComplaints() {
    const query = $("search").value.toLowerCase();
    const filter = $("filter").value;

    const filtered = complaints.filter(c => {
        const matchSearch = (
            c.id + c.room + c.category + c.student
        ).toLowerCase().includes(query);

        const matchStatus =
            filter === "All" || c.status === filter;

        return matchSearch && matchStatus;
    });

    $("complaintList").innerHTML = filtered.map(c => `
        <tr>
            <td><b>${safe(c.id)}</b></td>
            <td>${safe(c.room)}</td>
            <td>${safe(c.category)}</td>
            <td>
                <span class="badge ${safe(c.urgency)}">
                    ${safe(c.urgency)}
                </span>
            </td>
            <td>${safe(c.status)}</td>
            <td>
                <button class="action-btn"
                    data-update="${safe(c.id)}">
                    Update
                </button>

                <button class="action-btn delete-btn"
                    data-delete="${safe(c.id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");

    $("emptyMessage").style.display =
        filtered.length === 0 ? "block" : "none";
}

// SEARCH AND FILTER
$("search").addEventListener("input", displayComplaints);
$("filter").addEventListener("change", displayComplaints);

// 5. UPDATE AND DELETE COMPLAINTS

$("complaintList").addEventListener("click", function(e) {
    const id = e.target.dataset.update ||
               e.target.dataset.delete;

    if (!id) return;

    const complaint = complaints.find(c => c.id === id);

    if (!complaint) return;

    // DELETE COMPLAINT
    if (e.target.dataset.delete) {
        if (confirm("Are you sure you want to delete this complaint?")) {
            complaints = complaints.filter(c => c.id !== id);
        }
    }

    // UPDATE STATUS
    if (e.target.dataset.update) {
        let index = stages.indexOf(complaint.status);

        if (index < stages.length - 1) {
            complaint.status = stages[index + 1];

            alert("Status updated to " + complaint.status);
        } else {
            alert("Complaint is already resolved!");
        }
    }

    saveData();
    refreshWebsite();
});

// 6. DASHBOARD STATISTICS

function updateDashboard() {
    $("total").textContent = complaints.length;

    $("registered").textContent =
        complaints.filter(c => c.status === "Registered").length;

    $("progress").textContent =
        complaints.filter(c =>
            ["Assigned", "In Progress"].includes(c.status)
        ).length;

    $("resolved").textContent =
        complaints.filter(c => c.status === "Resolved").length;
}

// 7. RECENT COMPLAINTS

function recentComplaints() {
    $("recentList").innerHTML =
        complaints.slice(0, 5).map(c => `
            <div class="recent-item">
                <div>
                    <b>${safe(c.id)} - ${safe(c.category)}</b>
                    <p>Room ${safe(c.room)} | ${safe(c.date)}</p>
                </div>

                <span class="badge ${safe(c.urgency)}">
                    ${safe(c.urgency)}
                </span>
            </div>
        `).join("");
}
// 8. TRACK COMPLAINT STATUS
function trackComplaint() {
    const id = $("trackId").value.trim().toUpperCase();

    const complaint = complaints.find(c => c.id === id);

    if (!complaint) {
        $("trackResult").innerHTML =
            "<p style='color:#ff8b9d;margin-top:20px'>Ticket not found. Check your ID.</p>";
        return;
    }

    const current = stages.indexOf(complaint.status);

    $("trackResult").innerHTML = `
        <div class="track-result">
            <h3>Ticket: ${safe(complaint.id)}</h3>

            <p>Room: ${safe(complaint.room)}</p>
            <p>Category: ${safe(complaint.category)}</p>
            <p>Urgency: ${safe(complaint.urgency)}</p>

            <p>Current Status:
                <b>${safe(complaint.status)}</b>
            </p>

            <div class="timeline">
                ${stages.map((stage, i) => `
                    <div class="timeline-step
                        ${i <= current ? "done" : ""}">
                        ${stage}
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

$("trackBtn").addEventListener("click", trackComplaint);

$("trackId").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        trackComplaint();
    }
});

// 9. EXPORT COMPLAINTS TO CSV

function exportComplaints() {
    if (!complaints.length) {
        alert("No complaints available to export!");
        return;
    }

    const header = [
        "Ticket ID",
        "Student",
        "Room",
        "Category",
        "Urgency",
        "Description",
        "Status"
    ];

    const rows = complaints.map(c =>
        [
            c.id,
            c.student,
            c.room,
            c.category,
            c.urgency,
            c.description,
            c.status
        ].map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");

    const file = new Blob(
        ["\uFEFF" + csv],
        { type: "text/csv" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(file);
    link.download = "HostelCare_Complaints.csv";
    link.click();

    URL.revokeObjectURL(link.href);
}

$("exportBtn").addEventListener("click", exportComplaints);

// 10. REFRESH WEBSITE

function refreshWebsite() {
    updateDashboard();
    displayComplaints();
    recentComplaints();
}
// INITIALIZE WEBSITE
refreshWebsite();