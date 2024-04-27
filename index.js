// TASK: import helper functions from utils
import { getTasks, createNewTask, patchTask, putTask, deleteTask } from './utils/taskFunctions.js';
// TASK: import initialData
import { initialData } from './data/initialData.js';

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData));
    localStorage.setItem('showSideBar', 'true');
  } else {
    console.log('Data already exists in localStorage');
  }
}
initializeData();

// TASK: Get elements from the DOM
const elements = {
  addNewTaskBtn: document.getElementById('add-new-task-btn'),
  newTaskModalWindow: document.getElementById('new-task-modal-window'),
  titleInput: document.getElementById('title-input'),
  descInput: document.getElementById('desc-input'),
  selectStatus: document.getElementById('select-status'),
  createTaskBtn: document.getElementById('create-task-btn'),
  cancelAddTaskBtn: document.getElementById('cancel-add-task-btn'),
  columnDivs: document.querySelectorAll('.column-div'),
  tasksContainers: document.querySelectorAll('.tasks-container'),
  editBoardBtn: document.getElementById('edit-board-btn'),
  editBoardDiv: document.getElementById('editBoardDiv'),
  deleteBoardBtn: document.getElementById('deleteBoardBtn'),
  headerBoardName: document.getElementById('header-board-name'),
  boardsNavLinksDiv: document.getElementById('boards-nav-links-div'),
  dropdownBtn: document.getElementById('dropdownBtn'),
  dropDownIcon: document.getElementById('dropDownIcon'),
  editTaskForm: document.getElementById('edit-task-form'),
  editTaskTitleInput: document.getElementById('edit-task-title-input'),
  editTaskDescInput: document.getElementById('edit-task-desc-input'),
  editSelectStatus: document.getElementById('edit-select-status'),
  saveTaskChangesBtn: document.getElementById('save-task-changes-btn'),
  cancelEditBtn: document.getElementById('cancel-edit-btn'),
  deleteTaskBtn: document.getElementById('delete-task-btn'),
  filterDiv: document.getElementById('filterDiv'),
  showSideBarBtn: document.getElementById('show-side-bar-btn'),
  hideSideBarBtn: document.getElementById('hide-side-bar-btn'),
  sideBarDiv: document.getElementById('side-bar-div'),
  iconDark: document.getElementById('icon-dark'),
  iconLight: document.getElementById('icon-light'),
  switchTheme: document.getElementById('switch'),
  editTaskModal: document.querySelector('.edit-task-modal-window'),
  themeSwitch: document.getElementById('switch')
};

let activeBoard = "";

// Extracts unique board names from tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);

  if (boards.length > 0) {
    const localStorageBoard = localStorage.getItem("activeBoard");
    activeBoard = localStorageBoard ? localStorageBoard : boards[0];
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener("click", () => {
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board; //assigns active board
      localStorage.setItem("activeBoard", board);
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}

// Filters tasks corresponding to the board name and displays them on the DOM.
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks(); // Fetch tasks from a simulated local storage function
  const filteredTasks = tasks.filter(task => task.board === boardName);

  elements.columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    // Reset column content while preserving the column title
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    tasksContainer.classList.add("tasks-container");
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => {
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      // Listen for a click event on each task and open a modal
      taskElement.addEventListener("click", () => {
        openEditTaskModal(task);
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}

function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {
    if (btn.textContent === boardName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`);
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute('data-task-id', task.id);

  taskElement.addEventListener('click', () => {
    openEditTaskModal(task);
  });

  tasksContainer.appendChild(taskElement);
}

function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener('click', () => toggleModal(false, elements.editTaskModal));

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false, elements.newTaskModalWindow);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false, elements.newTaskModalWindow);
    toggleModal(false, elements.editTaskModal);
    elements.filterDiv.style.display = 'none';
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));

  // Theme switch event listener
  elements.themeSwitch.addEventListener('change', toggleTheme);

  // Show Add New Task Modal event listener
  elements.addNewTaskBtn.addEventListener('click', () => {
    toggleModal(true, elements.newTaskModalWindow);
    elements.filterDiv.style.display = 'block'; // Also show the filter overlay
  });

  // Add new task form submission event listener
  elements.createTaskBtn.addEventListener('click', (event) => {
    addTask(event);
  });
}

// Toggles tasks modal
function toggleModal(show, modal = elements.newTaskModalWindow) {
  modal.style.display = show ? 'block' : 'none';
}

function addTask(event) {
  event.preventDefault();

  // Assign user input to the task object
  const task = {
    title: elements.titleInput.value,
    description: elements.descInput.value,
    status: elements.selectStatus.value,
    board: activeBoard
  };

  const newTask = createNewTask(task);
  if (newTask) {
    addTaskToUI(newTask);
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
    event.target.reset();
    refreshTasksUI();
  }
}

function toggleSidebar(show) {
  const sideBarDiv = document.getElementById('side-bar-div');

  if (show) {
    sideBarDiv.style.display = 'block';
    elements.showSideBarBtn.style.display = 'none';
  } else {
    sideBarDiv.style.display = 'none';
    elements.showSideBarBtn.style.display = 'block';
  }

  localStorage.setItem('showSideBar', show);
}

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLightTheme = document.body.classList.contains('light-theme');
  localStorage.setItem('light-theme', isLightTheme ? 'enabled' : 'disabled');
}

function openEditTaskModal(task) {
  elements.editTaskTitleInput.value = task.title;
  elements.editTaskDescInput.value = task.description;
  elements.editSelectStatus.value = task.status;

  elements.saveTaskChangesBtn.addEventListener('click', () => {
    saveTaskChanges(task.id);
  });

  elements.deleteTaskBtn.addEventListener('click', () => {
    deleteTask(task.id);
    toggleModal(false, elements.editTaskModal);
    refreshTasksUI();
  });

  toggleModal(true, elements.editTaskModal); // Show the edit task modal
}

function saveTaskChanges(taskId) {
  const updatedTask = {
    title: elements.editTaskTitleInput.value,
    description: elements.editTaskDescInput.value,
    status: elements.editSelectStatus.value,
    board: activeBoard
  };

  putTask(taskId, updatedTask);
  toggleModal(false, elements.editTaskModal);
  refreshTasksUI();
}

document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
});

// Get the button elements for saving changes and deleting the task
const saveChangesBtn = document.getElementById('save-task-changes-btn');
const deleteTaskBtn = document.getElementById('delete-task-btn');

// Remove any existing event listeners on the Save Changes button
saveChangesBtn.removeEventListener('click', saveChangesHandler);
// Remove any existing event listeners on the Delete Task button
deleteTaskBtn.removeEventListener('click', deleteTaskHandler);

// Add event listeners to the Save Changes and Delete Task buttons
saveChangesBtn.addEventListener(
  'click',
  saveChangesHandlerOnce(saveChangesHandler)
);
deleteTaskBtn.addEventListener(
  'click',
  deleteTaskHandlerOnce(deleteTaskHandler)
);

// Show the edit task modal
toggleModal(true, elements.editTaskModal);
refreshTasksUI();

// Helper function to ensure the save changes handler is only added once
function saveChangesHandlerOnce(handler) {
  let executed = false;
  return function () {
    if (!executed) {
      executed = true;
      handler();
    }
  };
}

// Helper function to ensure the delete task handler is only added once
function deleteTaskHandlerOnce(handler) {
  let executed = false;
  return function () {
    if (!executed) {
      executed = true;
      handler();
    }
  };
}

const addTitle = document.getElementById('title-input').value;
const addDescription = document.getElementById('desc-input').value;
const addStatus = document.getElementById('select-status').value;

function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}
