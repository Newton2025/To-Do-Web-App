document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    const selectedDateEl = document.getElementById('selected-date');
    const addTaskBtn = document.getElementById('add-task-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModalBtn = document.querySelector('.close-modal');
    const taskForm = document.getElementById('task-form');
    const taskListEl = document.getElementById('task-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const monthYearDisplay = document.getElementById('month-year');
    const changeDateBtn = document.getElementById('change-date-btn');
    const dateModalOverlay = document.getElementById('date-modal-overlay');
    const datePicker = document.getElementById('date-picker');
    const selectDateBtn = document.getElementById('select-date-btn');
    const closeDateModalBtn = dateModalOverlay.querySelector('.close-modal');

    let selectedDate = null;
    let tasks = JSON.parse(localStorage.getItem('tasks')) || {};
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    // Render calendar
    function renderCalendar() {
        const date = new Date(currentYear, currentMonth);
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = new Date(year, month, 1).getDay();

        monthYearDisplay.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

        const calendarDays = [];
        for (let i = 0; i < firstDayIndex; i++) {
            calendarDays.push('<div class="empty-day"></div>');
        }
        for (let day = 1; day <= daysInMonth; day++) {
            calendarDays.push(`<div class="day" data-day="${day}">${day}</div>`);
        }
        calendarEl.innerHTML = calendarDays.join('');

        // Re-apply selected class to the selected date if it's in the visible month
        if (selectedDate) {
            const [selectedMonth, selectedDay, selectedYear] = selectedDate.split('/').map(Number);
            if (selectedMonth - 1 === currentMonth && selectedYear === currentYear) {
                const selectedDayEl = calendarEl.querySelector(`.day[data-day="${selectedDay}"]`);
                if (selectedDayEl) {
                    selectedDayEl.classList.add('selected');
                }
            } else {
                selectedDate = null;
                selectedDateEl.textContent = 'Select a Date';
                taskListEl.innerHTML = '<p class="no-ttasks">Please select a date to view tasks.</p>';
            }
        }
    }

    // Update selected date
    function updateSelectedDate(day) {
        selectedDate = `${currentMonth + 1}/${day}/${currentYear}`;
        selectedDateEl.textContent = `Tasks for ${selectedDate}`;
        renderTasks();
    }

    // Render tasks
    function renderTasks(filter = 'all') {
        if (!selectedDate) {
            taskListEl.innerHTML = '<p class="no-tasks">Please select a date to view tasks.</p>';
            return;
        }
        const dayTasks = tasks[selectedDate] || [];
        const filteredTasks = dayTasks.filter(task => filter === 'all' || task.category === filter);

        taskListEl.innerHTML = '';

        if (filteredTasks.length === 0) {
            taskListEl.innerHTML = '<p class="no-tasks">No tasks available for this date.</p>';
            return;
        }

        filteredTasks.forEach((task, index) => {
            const taskCard = document.createElement('div');
            taskCard.classList.add('task-card');
            taskCard.innerHTML = `
                <h4>${task.title}</h4>
                <p>${task.description}</p>
                <span class="category">${task.category}</span>
                <div class="task-actions">
                    <button class="edit-task-btn" data-index="${index}">Edit</button>
                    <button class="delete-task-btn" data-index="${index}">Delete</button>
                </div>
            `;
            taskListEl.appendChild(taskCard);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskIndex = e.target.dataset.index;
                openEditModal(taskIndex);
            });
        });

        document.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskIndex = e.target.dataset.index;
                deleteTask(taskIndex);
            });
        });

        // Hide buttons on mobile if there are 5 or more tasks
        if (window.innerWidth <= 767) {
            const headerButtons = document.querySelector('.header-buttons');
            if (dayTasks.length >= 5) {
                headerButtons.style.display = 'none';
            } else {
                headerButtons.style.display = 'flex';
            }
        }
    }

    // Add an event listener to re-run renderTasks on window resize
    window.addEventListener('resize', () => {
        renderTasks();
    });

    // Function to open modal for editing a task
    function openEditModal(taskIndex) {
        const task = tasks[selectedDate][taskIndex];
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description;
        document.getElementById('task-category').value = task.category;
        taskForm.dataset.editing = taskIndex;
        modalOverlay.style.display = 'flex';
    }

    // Event listeners
    calendarEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('day')) {
            document.querySelectorAll('.calendar .day').forEach(dayEl => {
                dayEl.classList.remove('selected');
            });
            e.target.classList.add('selected');
            updateSelectedDate(e.target.dataset.day);
        }
    });

    addTaskBtn.addEventListener('click', () => {
        if (!selectedDate) {
            alert('Please select a date first.');
            return;
        }
        modalOverlay.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });

    // Modify task form submit event listener
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-desc').value.trim();
        const category = document.getElementById('task-category').value;

        if (!title || !description) {
            alert('Please fill in all fields.');
            return;
        }

        const newTask = {
            title,
            description,
            category
        };

        if (taskForm.dataset.editing) {
            // Edit existing task
            const taskIndex = taskForm.dataset.editing;
            tasks[selectedDate][taskIndex] = newTask;
            delete taskForm.dataset.editing;
        } else {
            // Add new task
            if (!tasks[selectedDate]) {
                tasks[selectedDate] = [];
            }
            tasks[selectedDate].push(newTask);
        }
        localStorage.setItem('tasks', JSON.stringify(tasks));

        taskForm.reset();
        modalOverlay.style.display = 'none';
        renderTasks();
    });

    // Function to delete a task
    function deleteTask(taskIndex) {
        tasks[selectedDate].splice(taskIndex, 1);
        if (tasks[selectedDate].length === 0) {
            delete tasks[selectedDate];
        }
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderTasks(button.dataset.filter);
        });
    });

    // Handle month navigation
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // Open date modal when "Change Date" button is clicked
    changeDateBtn.addEventListener('click', () => {
        dateModalOverlay.style.display = 'flex';
    });

    // Close date modal
    closeDateModalBtn.addEventListener('click', () => {
        dateModalOverlay.style.display = 'none';
    });

    // Handle date selection
    selectDateBtn.addEventListener('click', () => {
        const selected = datePicker.value;
        if (selected) {
            const date = new Date(selected);
            currentYear = date.getFullYear();
            currentMonth = date.getMonth();
            renderCalendar();

            const day = date.getDate();
            updateSelectedDate(day);

            dateModalOverlay.style.display = 'none';
        } else {
            alert('Please select a date.');
        }
    });

    // Initial setup
    renderCalendar();
});
