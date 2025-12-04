// Состояние приложения
let state = {
    folders: [],
    currentFolder: null,
    currentNote: null,
    editingNote: null,
    folderToDelete: null,
    user: {
        id: null,
        name: '',
        email: '',
        avatar: 'default'
    }
};

// Конфигурация API
const API_URL = 'http://localhost:8000';

// Класс API сервиса
class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const url = `${API_URL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            console.log(`API ${endpoint}:`, {
            status: response.status,
            statusText: response.statusText
            });

            // Если токен невалиден - разлогиниваем
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user_email');
                localStorage.removeItem('user_name');
                window.location.href = 'auth.html';
                return null;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API request failed (${endpoint}):`, error);
            
            // Более понятные сообщения об ошибках
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Нет соединения с сервером. Проверьте, запущен ли бэкенд на localhost:8000');
            }
            
            throw error;
        }
    }

    // Методы для работы с папками
    async getFolders() {
        return this.request('/api/folders/');
    }

    async createFolder(name) {
        return this.request('/api/folders/', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }

    async deleteFolder(folderId) {
        return this.request(`/api/folders/${folderId}`, {
            method: 'DELETE'
        });
    }

    // Методы для работы с конспектами
    async getNotes(folderId) {
        return this.request(`/api/folders/${folderId}/notes/`);
    }

    async createNote(folderId, title, content = '', original_text = '') {
        return this.request(`/api/folders/${folderId}/notes/`, {
            method: 'POST',
            body: JSON.stringify({ 
                title, 
                content,
                original_text: original_text || content
            })
        });
    }

    async updateNote(noteId, updates) {
        return this.request(`/api/notes/${noteId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteNote(noteId) {
        return this.request(`/api/notes/${noteId}`, {
            method: 'DELETE'
        });
    }

    // Метод для AI-обработки текста
    async processText(text, operation = 'enhance') {
        return this.request('/api/ai/process', {
            method: 'POST',
            body: JSON.stringify({ 
                text, 
                operation 
            })
        });
    }

    async processImage(imageFile, operation = 'enhance') {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('operation', operation);

        const headers = {
            'Authorization': `Bearer ${this.token}`
        };

        const response = await fetch(`${API_URL}/api/ai/process-image`, {
            method: 'POST',
            headers,
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Image processing failed');
        }

        return await response.json();
    }

    // Методы для пользователя
    async getUserProfile() {
        return this.request('/api/users/me');
    }

    async updateUserProfile(updates) {
        return this.request('/api/users/me', {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
}

// Создаем глобальный экземпляр API сервиса
let api = null;

// Инициализация приложения
async function init() {
    // Проверяем авторизацию
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    // Инициализируем API сервис
    api = new ApiService();
    
    // Загружаем данные пользователя
    await loadUserData();
    
    // Инициализируем остальные компоненты
    initializeElements();
    renderFolders();
    updateStats();
    setupEventListeners();
    setupFormattingToolbar();
    updateUserDisplay();
}

// Загрузка данных пользователя с бэкенда
async function loadUserData() {
    try {
        // Загружаем профиль пользователя
        const userProfile = await api.getUserProfile();
        state.user = {
            id: userProfile.id,
            name: userProfile.name || userProfile.email,
            email: userProfile.email,
            avatar: userProfile.avatar || 'default'
        };
        // обновление данных
        localStorage.setItem('user_name', state.user.name);
        localStorage.setItem('user_email', state.user.email);
        updateUserDisplay();

        // Загружаем папки пользователя
        const foldersData = await api.getFolders();
        
        // Преобразуем данные бэкенда в формат фронтенда
        state.folders = await Promise.all(foldersData.map(async (folder) => {
            // Загружаем конспекты для каждой папки
            let notes = [];
            try {
                const notesData = await api.getNotes(folder.id);
                notes = notesData.map(note => ({
                    id: note.id,
                    title: note.title,
                    content: note.content || '',
                    originalText: note.original_text || note.content || '',
                    smartText: note.content || '<div class="note-content"><p>Ваш конспект будет здесь...</p></div>',
                    date: note.created_at || note.updated_at || new Date().toISOString()
                }));
            } catch (error) {
                console.error(`Error loading notes for folder ${folder.id}:`, error);
                notes = [];
            }
            
            return {
                id: folder.id,
                name: folder.name,
                notes: notes
            };
        }));

        // Если нет папок, создаем папку по умолчанию
        if (state.folders.length === 0) {
            try {
                const defaultFolder = await api.createFolder('Мои конспекты');
                state.folders.push({
                    id: defaultFolder.id,
                    name: defaultFolder.name,
                    notes: []
                });
            } catch (error) {
                console.error('Error creating default folder:', error);
            }
        }

        renderFolders();
        updateStats();

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        
        let errorMessage = 'Ошибка загрузки данных. ';
        if (error.message.includes('Нет соединения')) {
            errorMessage += 'Убедитесь, что бэкенд FastAPI запущен на localhost:8000';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
        
        // Если ошибка авторизации - переходим на страницу входа
        if (error.message.includes('401') || error.message.includes('token')) {
            window.location.href = 'auth.html';
        }
    }
}

// Функция для обновления отображения пользователя
function updateUserDisplay() {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userName = document.querySelector('.user-name');
    const userBtn = document.querySelector('.user-btn');
    
    if (userNameDisplay && state.user.name) {
        userNameDisplay.textContent = state.user.name;
    }
    if (userName && state.user.name) {
        userName.textContent = state.user.name;
    }
    if (userBtn && state.user.name) {
        // Обновляем только текст, сохраняя иконку и стрелку
        const icon = userBtn.querySelector('i');
        const arrow = userBtn.querySelector('.fa-chevron-down') || ' ▼';
        userBtn.innerHTML = `<i class="${icon.className}"></i> ${state.user.name} ▼`;
    }
}

// Элементы DOM
let elements = {};

// Инициализация элементов DOM
function initializeElements() {
    elements = {
        // Основные секции
        homeView: document.getElementById('homeView'),
        folderContentView: document.getElementById('folderContentView'),
        noteView: document.getElementById('noteView'),
        noteEditorView: document.getElementById('noteEditorView'),
        
        // Боковая панель
        foldersList: document.getElementById('foldersList'),
        mainLink: document.getElementById('mainLink'),
        
        // Заголовки
        currentFolderTitle: document.getElementById('currentFolderTitle'),
        editorTitle: document.getElementById('editorTitle'),
        viewNoteTitle: document.getElementById('viewNoteTitle'),
        
        // Контейнеры
        notesContainer: document.getElementById('notesContainer'),
        emptyFolder: document.getElementById('emptyFolder'),
        notesCount: document.getElementById('notesCount'),
        noteTextContent: document.getElementById('noteTextContent'),
        
        // Кнопки
        newFolderBtn: document.getElementById('newFolderBtn'),
        newNoteBtn: document.getElementById('newNoteBtn'),
        createFirstNoteBtn: document.getElementById('createFirstNoteBtn'),
        backFromNoteView: document.getElementById('backFromNoteView'),
        backToNoteView: document.getElementById('backToNoteView'),
        saveNoteBtn: document.getElementById('saveNoteBtn'),
        saveViewNoteBtn: document.getElementById('saveViewNoteBtn'),
        generateBtn: document.getElementById('generateBtn'),
        regenerateBtn: document.getElementById('regenerateBtn'),
        uploadBtn: document.getElementById('uploadBtn'),
        editAiBtn: document.getElementById('editAiBtn'),
        editTitleBtn: document.getElementById('editTitleBtn'),
        undoBtn: document.getElementById('undoBtn'),
        redoBtn: document.getElementById('redoBtn'),
        downloadViewNoteBtn: document.getElementById('downloadViewNoteBtn'),
        
        // Поля редактора
        sourceMaterial: document.getElementById('sourceMaterial'),
        smartNotesEditable: document.getElementById('smartNotesEditable'),
        
        // Модальные окна
        folderModal: document.getElementById('folderModal'),
        noteModal: document.getElementById('noteModal'),
        titleModal: document.getElementById('titleModal'),
        settingsModal: document.getElementById('settingsModal'),
        aboutModal: document.getElementById('aboutModal'),
        helpModal: document.getElementById('helpModal'),
        deleteFolderModal: document.getElementById('deleteFolderModal'),
        
        // Статистика
        totalFolders: document.getElementById('totalFolders'),
        totalNotes: document.getElementById('totalNotes'),
        
        // Пользовательское меню
        userBtn: document.getElementById('userBtn'),
        dropdownContent: document.getElementById('dropdownContent'),
        settingsBtn: document.getElementById('settingsBtn'),
        logoutBtn: document.getElementById('logoutBtn'),
        
        // Настройки
        userName: document.getElementById('userName'),
        userEmail: document.getElementById('userEmail'),
        userPassword: document.getElementById('userPassword'),
        confirmPassword: document.getElementById('confirmPassword'),
        changeAvatarBtn: document.getElementById('changeAvatarBtn'),
        cancelSettings: document.getElementById('cancelSettings'),
        saveSettings: document.getElementById('saveSettings'),
        
        // Навигация
        aboutLink: document.getElementById('aboutLink'),
        helpLink: document.getElementById('helpLink'),
        closeAbout: document.getElementById('closeAbout'),
        closeHelp: document.getElementById('closeHelp'),
        
        // Создание конспекта
        cancelNote: document.getElementById('cancelNote'),
        confirmNote: document.getElementById('confirmNote'),
        noteNameInput: document.getElementById('noteNameInput'),
        
        // Изменение названия
        cancelTitle: document.getElementById('cancelTitle'),
        confirmTitle: document.getElementById('confirmTitle'),
        titleInput: document.getElementById('titleInput'),
        
        // Создание папки
        cancelFolder: document.getElementById('cancelFolder'),
        confirmFolder: document.getElementById('confirmFolder'),
        folderNameInput: document.getElementById('folderNameInput'),
        
        // Удаление папки
        folderToDeleteName: document.getElementById('folderToDeleteName'),
        cancelDeleteFolder: document.getElementById('cancelDeleteFolder'),
        confirmDeleteFolder: document.getElementById('confirmDeleteFolder')
    };
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Создание папки
    if (elements.newFolderBtn) elements.newFolderBtn.addEventListener('click', showFolderModal);
    if (elements.cancelFolder) elements.cancelFolder.addEventListener('click', hideFolderModal);
    if (elements.confirmFolder) elements.confirmFolder.addEventListener('click', createFolder);
    
    // Создание конспекта
    if (elements.newNoteBtn) elements.newNoteBtn.addEventListener('click', showNoteModal);
    if (elements.createFirstNoteBtn) elements.createFirstNoteBtn.addEventListener('click', showNoteModal);
    if (elements.cancelNote) elements.cancelNote.addEventListener('click', hideNoteModal);
    if (elements.confirmNote) elements.confirmNote.addEventListener('click', createNewNoteFromModal);
    
    // Навигация
    if (elements.backFromNoteView) elements.backFromNoteView.addEventListener('click', showFolderContent);
    if (elements.backToNoteView) elements.backToNoteView.addEventListener('click', showNoteView);
    if (elements.mainLink) elements.mainLink.addEventListener('click', showHomeView);
    
    // Сохранение
    if (elements.saveNoteBtn) elements.saveNoteBtn.addEventListener('click', saveNote);
    if (elements.saveViewNoteBtn) elements.saveViewNoteBtn.addEventListener('click', saveNoteFromView);
    
    // Генерация конспекта
    if (elements.generateBtn) elements.generateBtn.addEventListener('click', generateSmartNotesAI);
    if (elements.regenerateBtn) elements.regenerateBtn.addEventListener('click', generateSmartNotesAI);
    
    // Загрузка изображений
    if (elements.uploadBtn) {
        elements.uploadBtn.addEventListener('click', () => {
            const imageUpload = document.getElementById('imageUpload');
            if (imageUpload) imageUpload.click();
        });
    }
    
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) imageUpload.addEventListener('change', handleImageUpload);
    
    // Пользовательское меню
    if (elements.userBtn) elements.userBtn.addEventListener('click', toggleUserMenu);
    if (elements.settingsBtn) elements.settingsBtn.addEventListener('click', showSettingsModal);
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', logout);
    
    // Настройки
    if (elements.cancelSettings) elements.cancelSettings.addEventListener('click', hideSettingsModal);
    if (elements.saveSettings) elements.saveSettings.addEventListener('click', saveSettings);
    if (elements.changeAvatarBtn) elements.changeAvatarBtn.addEventListener('click', changeAvatar);
    
    // Просмотр конспекта
    if (elements.editAiBtn) elements.editAiBtn.addEventListener('click', showNoteEditorFromView);
    if (elements.editTitleBtn) elements.editTitleBtn.addEventListener('click', showTitleModal);
    if (elements.downloadViewNoteBtn) elements.downloadViewNoteBtn.addEventListener('click', downloadNoteFromView);
    
    // Изменение названия
    if (elements.cancelTitle) elements.cancelTitle.addEventListener('click', hideTitleModal);
    if (elements.confirmTitle) elements.confirmTitle.addEventListener('click', changeNoteTitle);
    
    // Новые кнопки отмены/возврата
    if (elements.undoBtn) elements.undoBtn.addEventListener('click', undoEdit);
    if (elements.redoBtn) elements.redoBtn.addEventListener('click', redoEdit);
    
    // Удаление папки
    if (elements.cancelDeleteFolder) elements.cancelDeleteFolder.addEventListener('click', hideDeleteFolderModal);
    if (elements.confirmDeleteFolder) elements.confirmDeleteFolder.addEventListener('click', deleteFolder);
    
    // Модальные окна навигации
    if (elements.aboutLink) elements.aboutLink.addEventListener('click', showAboutModal);
    if (elements.helpLink) elements.helpLink.addEventListener('click', showHelpModal);
    if (elements.closeAbout) elements.closeAbout.addEventListener('click', hideAboutModal);
    if (elements.closeHelp) elements.closeHelp.addEventListener('click', hideHelpModal);
    
    // Автосохранение при изменении текста
    if (elements.noteTextContent) {
        elements.noteTextContent.addEventListener('input', debounce(autoSaveNote, 2000));
    }
    
    // Закрытие модальных окон
    window.addEventListener('click', (e) => {
        if (elements.folderModal && e.target === elements.folderModal) hideFolderModal();
        if (elements.noteModal && e.target === elements.noteModal) hideNoteModal();
        if (elements.titleModal && e.target === elements.titleModal) hideTitleModal();
        if (elements.settingsModal && e.target === elements.settingsModal) hideSettingsModal();
        if (elements.aboutModal && e.target === elements.aboutModal) hideAboutModal();
        if (elements.helpModal && e.target === elements.helpModal) hideHelpModal();
        if (elements.deleteFolderModal && e.target === elements.deleteFolderModal) hideDeleteFolderModal();
        
        if (elements.dropdownContent && !e.target.matches('.user-btn')) {
            elements.dropdownContent.classList.remove('show');
        }
    });
}

// Настройка панели форматирования
function setupFormattingToolbar() {
    const formatButtons = document.querySelectorAll('.format-btn');
    formatButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.dataset.command;
            document.execCommand(command, false, null);
            const activeEditable = document.querySelector('[contenteditable="true"]:focus') || elements.smartNotesEditable || elements.noteTextContent;
            if (activeEditable) activeEditable.focus();
        });
    });
}

// Рендеринг папок в боковой панели
function renderFolders() {
    if (!elements.foldersList) return;
    
    elements.foldersList.innerHTML = '';
    
    state.folders.forEach(folder => {
        const folderItem = document.createElement('li');
        folderItem.className = 'folder-item';
        if (state.currentFolder && state.currentFolder.id === folder.id) {
            folderItem.classList.add('active');
        }
        
        folderItem.innerHTML = `
            ${folder.name}
            <span class="note-count">${folder.notes.length}</span>
            <div class="folder-actions">
                <button class="btn-folder-delete" data-folder-id="${folder.id}" title="Удалить папку">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        folderItem.addEventListener('click', (e) => {
            if (!e.target.closest('.btn-folder-delete')) {
                selectFolder(folder);
            }
        });
        
        const deleteBtn = folderItem.querySelector('.btn-folder-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteFolderModal(folder);
            });
        }
        
        elements.foldersList.appendChild(folderItem);
    });
}

// Выбор папки
function selectFolder(folder) {
    state.currentFolder = folder;
    renderFolders();
    showFolderContent();
}

// Показать содержимое папки
function showFolderContent() {
    hideAllSections();
    if (elements.folderContentView) {
        elements.folderContentView.classList.add('active');
        elements.folderContentView.style.display = 'block';
    }
    
    if (elements.currentFolderTitle) {
        elements.currentFolderTitle.textContent = `Папка: ${state.currentFolder.name}`;
    }
    if (elements.notesCount) {
        elements.notesCount.textContent = state.currentFolder.notes.length;
    }
    renderNotes();
}

// Рендеринг конспектов в папке
function renderNotes() {
    if (!elements.notesContainer || !elements.emptyFolder) return;
    
    elements.notesContainer.innerHTML = '';
    
    if (state.currentFolder.notes.length === 0) {
        elements.emptyFolder.style.display = 'block';
        elements.notesContainer.style.display = 'none';
        return;
    }
    
    elements.emptyFolder.style.display = 'none';
    elements.notesContainer.style.display = 'grid';
    
    state.currentFolder.notes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.innerHTML = `
            <div class="note-card-header">
                <div>
                    <div class="note-title">${note.title}</div>
                    <div class="note-date">${formatDate(note.date)}</div>
                </div>
            </div>
            <div class="note-preview">${(note.content || note.smartText || '').substring(0, 100)}...</div>
            <div class="note-actions">
                <button class="btn-note-action btn-note-edit" data-note-id="${note.id}">
                    <i class="fas fa-edit"></i>Редактировать
                </button>
                <button class="btn-note-action btn-note-delete" data-note-id="${note.id}">
                    <i class="fas fa-trash"></i>Удалить
                </button>
            </div>
        `;
        elements.notesContainer.appendChild(noteCard);
    });

    // Добавляем обработчики для кнопок в карточках конспектов
    document.querySelectorAll('.btn-note-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const noteId = parseInt(e.target.closest('button').dataset.noteId);
            editNote(noteId);
        });
    });

    document.querySelectorAll('.btn-note-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const noteId = parseInt(e.target.closest('button').dataset.noteId);
            deleteNote(noteId);
        });
    });
}

// Форматирование даты
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return new Date().toLocaleDateString('ru-RU');
    }
}

// Создание нового конспекта - модальное окно
function showNoteModal() {
    if (!state.currentFolder) {
        alert('Пожалуйста, выберите папку для создания конспекта');
        return;
    }
    if (elements.noteModal) {
        elements.noteModal.style.display = 'block';
        if (elements.noteNameInput) {
            elements.noteNameInput.value = '';
            elements.noteNameInput.focus();
        }
    }
}

function hideNoteModal() {
    if (elements.noteModal) elements.noteModal.style.display = 'none';
}

async function createNewNoteFromModal() {
    const noteName = elements.noteNameInput ? elements.noteNameInput.value.trim() : '';
    if (!noteName) {
        alert('Пожалуйста, введите название конспекта');
        return;
    }
    
    try {
        const newNote = await api.createNote(state.currentFolder.id, noteName);
        
        const noteData = {
            id: newNote.id,
            title: newNote.title,
            content: newNote.content || '',
            originalText: newNote.original_text || '',
            smartText: newNote.content || '<div class="note-content"><p>Ваш конспект будет здесь...</p></div>',
            date: newNote.created_at || new Date().toISOString()
        };
        
        state.currentFolder.notes.push(noteData);
        state.currentNote = noteData;
        
        hideNoteModal();
        
        // Переходим сразу в редактор для заполнения
        state.editingNote = noteData;
        if (elements.sourceMaterial) elements.sourceMaterial.value = '';
        if (elements.smartNotesEditable) elements.smartNotesEditable.innerHTML = '<div class="note-content"><p>Ваш конспект будет здесь...</p></div>';
        if (elements.editorTitle) elements.editorTitle.textContent = `Редактор с AI: ${noteName}`;
        
        showNoteEditor();
    } catch (error) {
        console.error('Ошибка создания конспекта:', error);
        alert('Ошибка создания конспекта: ' + error.message);
    }
}

// Просмотр конспекта
function editNote(noteId) {
    const note = state.currentFolder.notes.find(n => n.id === noteId);
    if (!note) return;
    
    state.currentNote = note;
    showNoteView();
}

function showNoteView() {
    hideAllSections();
    if (elements.noteView) {
        elements.noteView.classList.add('active');
        elements.noteView.style.display = 'block';
    }
    
    if (state.currentNote && elements.viewNoteTitle && elements.noteTextContent) {
        elements.viewNoteTitle.textContent = state.currentNote.title;
        elements.noteTextContent.innerHTML = state.currentNote.smartText || state.currentNote.content || '';
        
        // Включаем редактирование
        elements.noteTextContent.contentEditable = true;
        elements.noteTextContent.focus();
    }
}

// Переход из просмотра в редактор AI
function showNoteEditorFromView() {
    if (!state.currentNote) return;
    
    state.editingNote = state.currentNote;
    if (elements.sourceMaterial) elements.sourceMaterial.value = state.currentNote.originalText || state.currentNote.content || '';
    if (elements.smartNotesEditable) elements.smartNotesEditable.innerHTML = state.currentNote.smartText || state.currentNote.content || '';
    if (elements.editorTitle) elements.editorTitle.textContent = `Редактор с AI: ${state.currentNote.title}`;
    
    showNoteEditor();
}

// Изменение названия конспекта
function showTitleModal() {
    if (!state.currentNote) return;
    if (elements.titleInput && elements.titleModal) {
        elements.titleInput.value = state.currentNote.title;
        elements.titleModal.style.display = 'block';
    }
}

function hideTitleModal() {
    if (elements.titleModal) elements.titleModal.style.display = 'none';
}

async function changeNoteTitle() {
    const newTitle = elements.titleInput ? elements.titleInput.value.trim() : '';
    if (!newTitle) {
        alert('Пожалуйста, введите название конспекта');
        return;
    }
    
    try {
        await api.updateNote(state.currentNote.id, { title: newTitle });
        
        if (state.currentNote) {
            state.currentNote.title = newTitle;
            if (elements.viewNoteTitle) elements.viewNoteTitle.textContent = newTitle;
            renderNotes();
            updateStats();
        }
        
        hideTitleModal();
        showSuccessModal('Название конспекта изменено!');
    } catch (error) {
        console.error('Ошибка изменения названия:', error);
        alert('Ошибка изменения названия: ' + error.message);
    }
}

// Удаление конспекта
async function deleteNote(noteId) {
    if (!confirm('Вы уверены, что хотите удалить этот конспект?')) {
        return;
    }
    
    try {
        await api.deleteNote(noteId);
        
        state.currentFolder.notes = state.currentFolder.notes.filter(n => n.id !== noteId);
        renderNotes();
        renderFolders();
        updateStats();
        
        // Если удаляемый конспект был открыт, возвращаемся к папке
        if (state.currentNote && state.currentNote.id === noteId) {
            state.currentNote = null;
            showFolderContent();
        }
        
        showSuccessModal('Конспект удален!');
    } catch (error) {
        console.error('Ошибка удаления конспекта:', error);
        alert('Ошибка удаления конспекта: ' + error.message);
    }
}

// Показать домашнюю страницу
function showHomeView() {
    hideAllSections();
    if (elements.homeView) {
        elements.homeView.classList.add('active');
        elements.homeView.style.display = 'block';
    }
    
    state.currentFolder = null;
    state.currentNote = null;
    state.editingNote = null;
    renderFolders();
}

// Показать редактор конспекта
function showNoteEditor() {
    hideAllSections();
    if (elements.noteEditorView) {
        elements.noteEditorView.classList.add('active');
        elements.noteEditorView.style.display = 'block';
    }
}

// Скрыть все секции
function hideAllSections() {
    const sections = [
        elements.homeView,
        elements.folderContentView, 
        elements.noteView,
        elements.noteEditorView
    ];
    
    sections.forEach(section => {
        if (section) {
            section.classList.remove('active');
            section.style.display = 'none';
        }
    });
}

// Обновление статистики
function updateStats() {
    const totalFoldersCount = state.folders.length;
    const totalNotesCount = state.folders.reduce((sum, folder) => sum + folder.notes.length, 0);
    
    if (elements.totalFolders) elements.totalFolders.textContent = totalFoldersCount;
    if (elements.totalNotes) elements.totalNotes.textContent = totalNotesCount;
}

// Создание папки
function showFolderModal() {
    if (elements.folderModal) {
        elements.folderModal.style.display = 'block';
        if (elements.folderNameInput) {
            elements.folderNameInput.value = '';
            elements.folderNameInput.focus();
        }
    }
}

function hideFolderModal() {
    if (elements.folderModal) elements.folderModal.style.display = 'none';
}

async function createFolder() {
    const folderName = elements.folderNameInput ? elements.folderNameInput.value.trim() : '';
    if (!folderName) {
        alert('Введите название папки');
        return;
    }

    try {
        const newFolder = await api.createFolder(folderName);
        
        const folder = {
            id: newFolder.id,
            name: newFolder.name,
            notes: []
        };
        
        state.folders.push(folder);
        renderFolders();
        updateStats();
        hideFolderModal();
        
        // Автоматически выбираем новую папку
        selectFolder(folder);
        
        showSuccessModal(`Папка "${folderName}" создана!`);
    } catch (error) {
        console.error('Ошибка создания папки:', error);
        alert('Ошибка создания папки: ' + error.message);
    }
}

// Функции для работы с удалением папок
function showDeleteFolderModal(folder) {
    if (elements.deleteFolderModal && elements.folderToDeleteName) {
        elements.folderToDeleteName.textContent = folder.name;
        elements.deleteFolderModal.style.display = 'block';
        state.folderToDelete = folder;
    }
}

function hideDeleteFolderModal() {
    if (elements.deleteFolderModal) {
        elements.deleteFolderModal.style.display = 'none';
        state.folderToDelete = null;
    }
}

async function deleteFolder() {
    if (!state.folderToDelete) return;
    
    const folderName = state.folderToDelete.name;
    
    try {
        await api.deleteFolder(state.folderToDelete.id);
        
        // Удаляем папку из состояния
        state.folders = state.folders.filter(f => f.id !== state.folderToDelete.id);
        
        // Если удаляемая папка была текущей, сбрасываем текущую папку
        if (state.currentFolder && state.currentFolder.id === state.folderToDelete.id) {
            state.currentFolder = null;
            state.currentNote = null;
            showHomeView();
        }
        
        // Обновляем интерфейс
        renderFolders();
        updateStats();
        
        showSuccessModal(`Папка "${folderName}" успешно удалена!`);
        hideDeleteFolderModal();
    } catch (error) {
        console.error('Ошибка удаления папки:', error);
        alert('Ошибка удаления папки: ' + error.message);
    }
}

// AI-генерация конспекта с ML API
async function generateSmartNotesAI() {
    const sourceText = elements.sourceMaterial ? elements.sourceMaterial.value.trim() : '';
    
    if (!sourceText) {
        alert('Пожалуйста, введите текст для обработки');
        return;
    }
    
    showLoadingIndicator();
    
    try {
        const result = await api.processText(sourceText, 'enhance');
        
        if (elements.smartNotesEditable) {
            elements.smartNotesEditable.innerHTML = result.processed_text || result.content || '<p>Конспект сгенерирован</p>';
            showSuccessModal('Конспект успешно сгенерирован с помощью AI!');
        }
        
    } catch (error) {
        console.error('Error:', error);
        if (elements.smartNotesEditable) {
            elements.smartNotesEditable.innerHTML = '<div class="note-content"><p>Ошибка генерации конспекта. Попробуйте еще раз.</p></div>';
        }
        alert('AI обработка временно недоступна: ' + error.message);
    } finally {
        hideLoadingIndicator();
    }
}

// Обработка загрузки изображения с ML API
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        alert('Пожалуйста, выберите файл изображения');
        return;
    }
    
    showLoadingIndicator();
    
    try {
        const result = await api.processImage(file, 'enhance');
        
        if (elements.sourceMaterial) {
            elements.sourceMaterial.value = result.ocr_raw_text || result.original_text || 'Текст не распознан';
        }
        
        showSuccessModal(`Изображение обработано! Уверенность распознавания: ${(result.ocr_confidence * 100).toFixed(1)}%`);
        
    } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при обработке изображения: ' + error.message);
        
        if (elements.sourceMaterial) {
            elements.sourceMaterial.value = `[Текст, распознанный из изображения "${file.name}"]\n\nОшибка обработки. Попробуйте загрузить изображение с более четким текстом.`;
        }
    } finally {
        hideLoadingIndicator();
    }
}

// Функция для показа/скрытия индикатора загрузки
function showLoadingIndicator() {
    let loader = document.getElementById('loadingIndicator');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loadingIndicator';
        loader.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                       background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); 
                       z-index: 10000; text-align: center;">
                <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #8B5CF6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
                <p style="margin: 0; color: #333;">Обработка...</p>
            </div>
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                       background: rgba(0,0,0,0.5); z-index: 9999;"></div>
        `;
        document.body.appendChild(loader);
    }
    loader.style.display = 'block';
}

function hideLoadingIndicator() {
    const loader = document.getElementById('loadingIndicator');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Сохранение конспекта из редактора AI
async function saveNote() {
    const sourceText = elements.sourceMaterial ? elements.sourceMaterial.value.trim() : '';
    const smartText = elements.smartNotesEditable ? elements.smartNotesEditable.innerHTML : '';
    
    if (!sourceText) {
        alert('Пожалуйста, введите исходный текст');
        return;
    }
    
    try {
        const updates = {
            original_text: sourceText,
            content: smartText,
            title: state.editingNote ? state.editingNote.title : 'Новый конспект'
        };
        
        if (state.editingNote) {
            // Обновление существующего конспекта
            const updatedNote = await api.updateNote(state.editingNote.id, updates);
            
            // Обновляем в состоянии
            const noteIndex = state.currentFolder.notes.findIndex(n => n.id === state.editingNote.id);
            if (noteIndex !== -1) {
                state.currentFolder.notes[noteIndex] = {
                    ...state.currentFolder.notes[noteIndex],
                    ...updatedNote,
                    smartText: updatedNote.content,
                    originalText: updatedNote.original_text
                };
                state.currentNote = state.currentFolder.notes[noteIndex];
            }
        } else {
            // Создание нового конспекта
            const newNote = await api.createNote(state.currentFolder.id, updates.title, updates.content, sourceText);
            
            const noteData = {
                id: newNote.id,
                title: newNote.title,
                content: newNote.content,
                originalText: sourceText,
                smartText: newNote.content,
                date: newNote.created_at || new Date().toISOString()
            };
            
            state.currentFolder.notes.push(noteData);
            state.currentNote = noteData;
            state.editingNote = noteData;
        }
        
        showSuccessModal(`Конспект "${updates.title}" успешно ${state.editingNote ? 'обновлен' : 'сохранен'}!`);
        
        // Возвращаемся к просмотру конспекта
        showNoteView();
        renderNotes();
        renderFolders();
        updateStats();
    } catch (error) {
        console.error('Ошибка сохранения конспекта:', error);
        alert('Ошибка сохранения конспекта: ' + error.message);
    }
}

// Сохранение конспекта из режима просмотра
async function saveNoteFromView() {
    if (!state.currentNote || !elements.noteTextContent) return;
    
    const newContent = elements.noteTextContent.innerHTML;
    
    try {
        await api.updateNote(state.currentNote.id, { 
            content: newContent 
        });
        
        state.currentNote.smartText = newContent;
        state.currentNote.content = newContent;
        state.currentNote.date = new Date().toISOString();
        
        showSuccessModal('Конспект успешно сохранен!');
        renderNotes();
        updateStats();
    } catch (error) {
        console.error('Ошибка сохранения конспекта:', error);
        alert('Ошибка сохранения конспекта: ' + error.message);
    }
}

// Функции для отмены/возврата действий
function undoEdit() {
    document.execCommand('undo', false, null);
    if (elements.noteTextContent) elements.noteTextContent.focus();
}

function redoEdit() {
    document.execCommand('redo', false, null);
    if (elements.noteTextContent) elements.noteTextContent.focus();
}

// Функция автосохранения
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function autoSaveNote() {
    if (!state.currentNote || !elements.noteTextContent) return;
    
    const newContent = elements.noteTextContent.innerHTML;
    if (newContent !== (state.currentNote.smartText || state.currentNote.content)) {
        try {
            // Быстрое сохранение без ожидания ответа
            fetch(`${API_URL}/api/notes/${state.currentNote.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    content: newContent,
                    updated_at: new Date().toISOString()
                })
            }).catch(e => console.error('Auto-save error:', e));
            
            state.currentNote.smartText = newContent;
            state.currentNote.content = newContent;
            state.currentNote.date = new Date().toISOString();
            
            showAutoSaveIndicator();
        } catch (error) {
            console.error('Auto-save error:', error);
        }
    }
}

function showAutoSaveIndicator() {
    let indicator = document.querySelector('.auto-save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.innerHTML = '<i class="fas fa-check"></i> Автосохранение';
    indicator.style.display = 'block';
    
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 2000);
}

// Функция для показа модального окна успеха
function showSuccessModal(message) {
    let successModal = document.getElementById('successModal');
    
    if (!successModal) {
        successModal = document.createElement('div');
        successModal.id = 'successModal';
        successModal.className = 'modal';
        successModal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #10B981;"></i>
                </div>
                <h3 style="text-align: center; margin-bottom: 1rem;">Успешно!</h3>
                <div class="modal-text" style="text-align: center;">
                    <p>${message}</p>
                </div>
                <div class="modal-actions" style="justify-content: center;">
                    <button class="btn-confirm" id="closeSuccess" style="margin: 0;">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(successModal);
        
        document.getElementById('closeSuccess').addEventListener('click', () => {
            successModal.style.display = 'none';
        });
        
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.style.display = 'none';
            }
        });
    } else {
        successModal.querySelector('.modal-text p').textContent = message;
    }
    
    successModal.style.display = 'block';
    
    // Автоматически скрываем через 3 секунды
    setTimeout(() => {
        successModal.style.display = 'none';
    }, 3000);
}

// Скачивание из режима просмотра
function downloadNoteFromView() {
    if (!state.currentNote) return;
    
    const content = `
${state.currentNote.title.toUpperCase()}
${'='.repeat(state.currentNote.title.length)}

УМНЫЙ КОНСПЕКТ:
---------------
${state.currentNote.smartText || state.currentNote.content}

Создано в "Умном организаторе конспектов"
${new Date().toLocaleString('ru-RU')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Модальные окна навигации
function showAboutModal() {
    if (elements.aboutModal) elements.aboutModal.style.display = 'block';
}

function hideAboutModal() {
    if (elements.aboutModal) elements.aboutModal.style.display = 'none';
}

function showHelpModal() {
    if (elements.helpModal) {
        elements.helpModal.style.display = 'block';
        elements.helpModal.classList.add('help-modal');
    }
}

function hideHelpModal() {
    if (elements.helpModal) elements.helpModal.style.display = 'none';
}

// Настройки пользователя
function showSettingsModal() {
    if (elements.userName) elements.userName.value = state.user.name || '';
    if (elements.userEmail) elements.userEmail.value = state.user.email || '';
    if (elements.userPassword) elements.userPassword.value = '';
    if (elements.confirmPassword) elements.confirmPassword.value = '';
    if (elements.dropdownContent) elements.dropdownContent.classList.remove('show');
    if (elements.settingsModal) elements.settingsModal.style.display = 'block';
}

function hideSettingsModal() {
    if (elements.settingsModal) elements.settingsModal.style.display = 'none';
}

async function saveSettings() {
    const newName = elements.userName ? elements.userName.value.trim() : '';
    const newEmail = elements.userEmail ? elements.userEmail.value.trim() : '';
    const newPassword = elements.userPassword ? elements.userPassword.value : '';
    const confirmPassword = elements.confirmPassword ? elements.confirmPassword.value : '';
    
    if (!newName) {
        alert('Введите имя пользователя');
        return;
    }
    
    if (!newEmail) {
        alert('Введите email');
        return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
        alert('Пароли не совпадают');
        return;
    }
    
    try {
        const updates = { name: newName, email: newEmail };
        if (newPassword) {
            updates.password = newPassword;
        }
        
        await api.updateUserProfile(updates);
        
        // Обновляем состояние
        state.user.name = newName;
        state.user.email = newEmail;

        // Обновляем localStorage
        localStorage.setItem('user_name', newName);
        localStorage.setItem('user_email', newEmail);
        
        // Обновляем отображение
        updateUserDisplay();
        
        if (newPassword) {
            showSuccessModal('Пароль успешно изменен!');
        } else {
            showSuccessModal('Настройки сохранены!');
        }
        
        hideSettingsModal();
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        // БОЛЕЕ ДЕТАЛЬНАЯ ОШИБКА
        if (error.message.includes('400') || error.message.includes('422')) {
            alert('Ошибка валидации. Проверьте введенные данные. Возможно, email уже используется.');
        } else if (error.message.includes('403')) {
            alert('Доступ запрещен. Требуется авторизация.');
        } else {
            alert('Ошибка сохранения настроек: ' + error.message);
        }
    }
}

function changeAvatar() {
    alert('В реальном приложении здесь будет загрузка изображения');
}

// Пользовательское меню
function toggleUserMenu() {
    if (elements.dropdownContent) {
        elements.dropdownContent.classList.toggle('show');
    }
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_name');
        alert('Выход выполнен');
        if (elements.dropdownContent) elements.dropdownContent.classList.remove('show');
        window.location.href = 'auth.html';
    }
}

// Запуск приложения

document.addEventListener('DOMContentLoaded', init);
