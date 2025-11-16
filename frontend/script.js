// Состояние приложения
let state = {
    folders: [], // Убрали демо-папки - пустой массив
    currentFolder: null,
    currentNote: null,
    editingNote: null,
    folderToDelete: null,
    user: {
        name: '',
        email: '',
        avatar: 'default'
    }
};

// 
function loadUserData() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        const users = JSON.parse(localStorage.getItem('smartNotesUsers')) || [];
        const userData = users.find(u => u.email === currentUser.email);
        
        if (userData) {
            state.folders = userData.folders || [];
            state.user = {
                name: userData.name,
                email: userData.email,
                avatar: userData.avatar || 'default'
            };
            
            // Обновляем отображение
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = userData.name;
            }
            
            // Если нет папок, создаем папку по умолчанию
            if (state.folders.length === 0) {
                state.folders.push({ 
                    name: 'Мои конспекты', 
                    notes: [] 
                });
            }
        }
    } else {
        // Если пользователь не авторизован, редирект на страницу входа
        window.location.href = 'auth.html';
    }
}
function saveUserData() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (currentUser) {
        const users = JSON.parse(localStorage.getItem('smartNotesUsers')) || [];
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        
        if (userIndex !== -1) {
            users[userIndex].folders = state.folders;
            localStorage.setItem('smartNotesUsers', JSON.stringify(users));
        }
    }
}
// Функция для обновления отображения пользователя
function updateUserDisplay() {
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userName = document.querySelector('.user-name');
    
    if (userNameDisplay && state.user.name) {
        userNameDisplay.textContent = state.user.name;
    }
    if (userName && state.user.name) {
        userName.textContent = state.user.name;
    }
}

// Вызовите эту функцию в init()
function init() {
    loadUserData();
    initializeElements();
    renderFolders();
    updateStats();
    setupEventListeners();
    setupFormattingToolbar();
    updateUserDisplay();
}

// Элементы DOM
let elements = {};

// Инициализация приложения
function init() {
    initializeElements();
    renderFolders();
    updateStats();
    setupEventListeners();
    setupFormattingToolbar();
}

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
    
// Генерация конспекта - Изменено на AI версию
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
            // Фокусируемся на редактируемом поле
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
        if (state.currentFolder && state.currentFolder.name === folder.name) {
            folderItem.classList.add('active');
        }
        
        folderItem.innerHTML = `
            ${folder.name}
            <span class="note-count">${folder.notes.length}</span>
            <div class="folder-actions">
                <button class="btn-folder-delete" data-folder-name="${folder.name}" title="Удалить папку">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        folderItem.addEventListener('click', (e) => {
            // Проверяем, не кликнули ли по кнопке удаления
            if (!e.target.closest('.btn-folder-delete')) {
                selectFolder(folder);
            }
        });
        
        // Обработчик для кнопки удаления
        const deleteBtn = folderItem.querySelector('.btn-folder-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Предотвращаем всплытие события
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
                    <div class="note-date">${new Date(note.date).toLocaleDateString('ru-RU')}</div>
                </div>
            </div>
            <div class="note-preview">${note.originalText.substring(0, 100)}...</div>
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

function createNewNoteFromModal() {
    const noteName = elements.noteNameInput ? elements.noteNameInput.value.trim() : '';
    if (!noteName) {
        alert('Пожалуйста, введите название конспекта');
        return;
    }
    
    // Создаем пустой конспект
    const noteData = {
        id: Date.now(),
        title: noteName,
        originalText: '',
        smartText: '<div class="note-content"><p>Ваш конспект будет здесь...</p></div>',
        date: new Date().toISOString().split('T')[0]
    };
    
    state.currentFolder.notes.push(noteData);
    state.currentNote = noteData;
    
    hideNoteModal();
    saveUserData(); // ДОБАВЬТЕ ЭТУ СТРОКУ
    
    // Переходим сразу в редактор для заполнения
    state.editingNote = noteData;
    if (elements.sourceMaterial) elements.sourceMaterial.value = '';
    if (elements.smartNotesEditable) elements.smartNotesEditable.innerHTML = '<div class="note-content"><p>Ваш конспект будет здесь...</p></div>';
    if (elements.editorTitle) elements.editorTitle.textContent = `Редактор с AI: ${noteName}`;
    
    showNoteEditor();
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
        elements.noteTextContent.innerHTML = state.currentNote.smartText;
        
        // Включаем редактирование
        elements.noteTextContent.contentEditable = true;
        elements.noteTextContent.focus();
    }
}

// Переход из просмотра в редактор AI
function showNoteEditorFromView() {
    if (!state.currentNote) return;
    
    state.editingNote = state.currentNote;
    if (elements.sourceMaterial) elements.sourceMaterial.value = state.currentNote.originalText;
    if (elements.smartNotesEditable) elements.smartNotesEditable.innerHTML = state.currentNote.smartText;
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

function changeNoteTitle() {
    const newTitle = elements.titleInput ? elements.titleInput.value.trim() : '';
    if (!newTitle) {
        alert('Пожалуйста, введите название конспекта');
        return;
    }
    
    if (state.currentNote) {
        state.currentNote.title = newTitle;
        if (elements.viewNoteTitle) elements.viewNoteTitle.textContent = newTitle;
        renderNotes();
        updateStats();
    }
    
    hideTitleModal();
}

// Удаление конспекта
function deleteNote(noteId) {
    if (confirm('Вы уверены, что хотите удалить этот конспект?')) {
        state.currentFolder.notes = state.currentFolder.notes.filter(n => n.id !== noteId);
        renderNotes();
        renderFolders();
        updateStats();
        saveUserData();
        
        // Если удаляемый конспект был открыт, возвращаемся к папке
        if (state.currentNote && state.currentNote.id === noteId) {
            state.currentNote = null;
            showFolderContent();
        }
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

function createFolder() {
    const folderName = elements.folderNameInput ? elements.folderNameInput.value.trim() : '';
    if (folderName && !state.folders.find(f => f.name === folderName)) {
        state.folders.push({ name: folderName, notes: [] });
        renderFolders();
        updateStats();
        hideFolderModal();
        saveUserData(); // Сохраняем изменения - ДОБАВЬТЕ ЭТУ СТРОКУ
        
        // Автоматически выбираем новую папку
        const newFolder = state.folders.find(f => f.name === folderName);
        selectFolder(newFolder);
    }
}

// Функции для работы с удалением папок
function showDeleteFolderModal(folder) {
    if (elements.deleteFolderModal && elements.folderToDeleteName) {
        elements.folderToDeleteName.textContent = folder.name;
        elements.deleteFolderModal.style.display = 'block';
        // Сохраняем текущую папку для удаления
        state.folderToDelete = folder;
    }
}

function hideDeleteFolderModal() {
    if (elements.deleteFolderModal) {
        elements.deleteFolderModal.style.display = 'none';
        state.folderToDelete = null;
    }
}

function deleteFolder() {
    if (!state.folderToDelete) return;
    
    const folderName = state.folderToDelete.name;
    
    // Удаляем папку из состояния
    state.folders = state.folders.filter(f => f.name !== folderName);
    
    // Если удаляемая папка была текущей, сбрасываем текущую папку
    if (state.currentFolder && state.currentFolder.name === folderName) {
        state.currentFolder = null;
        state.currentNote = null;
        showHomeView();
    }
    
    // Обновляем интерфейс
    renderFolders();
    updateStats();
    saveUserData();
    
    // Показываем сообщение об успехе
    showSuccessModal(`Папка "${folderName}" успешно удалена!`);
    
    hideDeleteFolderModal();
}

// Генерация умного конспекта
function generateSmartNotes() {
    const sourceText = elements.sourceMaterial ? elements.sourceMaterial.value.trim() : '';
    
    if (!sourceText) {
        alert('Пожалуйста, введите текст для обработки');
        return;
    }
    
    // Имитация работы AI
    const smartNotes = generateMockSmartNotes(sourceText);
    if (elements.smartNotesEditable) {
        elements.smartNotesEditable.innerHTML = smartNotes;
    }
}

// Генерация mock-умного конспекта
function generateMockSmartNotes(text) {
    const words = text.split(' ').slice(0, 30).join(' ');
    
    return `
        <div class="note-content">
            <div class="note-section">
                <h4>Ключевые тезисы</h4>
                <ul>
                    <li><strong>Основная идея:</strong> ${text.split(' ').slice(0, 8).join(' ')}...</li>
                    <li><strong>Важные аспекты:</strong> ${text.split(' ').slice(8, 16).join(' ')}...</li>
                    <li><strong>Ключевые выводы:</strong> ${text.split(' ').slice(16, 24).join(' ')}...</li>
                </ul>
            </div>
            <div class="note-section">
                <h4>Структура материала</h4>
                <ul>
                    <li>Введение и постановка проблемы</li>
                    <li>Основные положения и аргументы</li>
                    <li>Примеры и доказательства</li>
                    <li>Заключение и выводы</li>
                </ul>
            </div>
            <div class="note-section">
                <h4>Детальный анализ</h4>
                <p>${text}</p>
                <p>Это автоматически сгенерированный конспект. Вы можете редактировать этот текст прямо здесь!</p>
                <p>Дополнительная информация для демонстрации скролла:</p>
                <ul>
                    <li>Пункт 1: Важная информация</li>
                    <li>Пункт 2: Дополнительные детали</li>
                    <li>Пункт 3: Примеры использования</li>
                    <li>Пункт 4: Рекомендации</li>
                    <li>Пункт 5: Заключительные мысли</li>
                    <li>Пункт 6: Практическое применение</li>
                    <li>Пункт 7: Будущие перспективы</li>
                    <li>Пункт 8: Ссылки на источники</li>
                </ul>
            </div>
            <div class="note-section">
                <h4>Резюме</h4>
                <p>Автоматически сгенерированный конспект предоставляет структурированное представление исходного материала, выделяя ключевые моменты и организуя информацию в удобной для восприятия форме.</p>
            </div>
        </div>
    `;
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
        const result = await processText(sourceText, 'enhance');
        
        if (result.success && elements.smartNotesEditable) {
            elements.smartNotesEditable.innerHTML = result.processed_text;
            showSuccessModal('Конспект успешно сгенерирован с помощью AI!');
        } else {
            throw new Error(result.error || 'Ошибка обработки текста');
        }
        
    } catch (error) {
        console.error('Error:', error);
        // Используем существующую mock-генерацию как запасной вариант
        const smartNotes = generateMockSmartNotes(sourceText);
        if (elements.smartNotesEditable) {
            elements.smartNotesEditable.innerHTML = smartNotes;
        }
        alert('AI обработка временно недоступна. Используется авто-генерация конспекта.');
    } finally {
        hideLoadingIndicator();
    }
}

// Функция для обработки изображения с ML API
async function handleImageUploadAI(event) {
    const file = event.target.files[0];
    if (file) {
        if (!file.type.match('image.*')) {
            alert('Пожалуйста, выберите файл изображения');
            return;
        }
        
        showLoadingIndicator();
        
        try {
            const result = await processImage(file, 'enhance');
            
            if (result.success) {
                if (elements.sourceMaterial) {
                    // Используем распознанный текст из ML API
                    elements.sourceMaterial.value = result.ocr_raw_text || result.original_text || 'Текст не распознан';
                }
                
                showSuccessModal(`Изображение обработано! Уверенность распознавания: ${(result.ocr_confidence * 100).toFixed(1)}%`);
                
            } else {
                throw new Error(result.error || 'Ошибка распознавания изображения');
            }
            
        } catch (error) {
            console.error('Error:', error);
            alert('Ошибка при обработке изображения: ' + error.message);
            
            // Запасной вариант
            if (elements.sourceMaterial) {
                elements.sourceMaterial.value = `[Текст, распознанный из изображения "${file.name}"]\n\nОшибка обработки. Попробуйте загрузить изображение с более четким текстом.`;
            }
        } finally {
            hideLoadingIndicator();
        }
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
                <div class="spinner"></div>
                <p style="margin-top: 1rem;">Обработка изображения...</p>
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
function saveNote() {
    const sourceText = elements.sourceMaterial ? elements.sourceMaterial.value.trim() : '';
    const smartText = elements.smartNotesEditable ? elements.smartNotesEditable.innerHTML : '';
    
    if (!sourceText) {
        alert('Пожалуйста, введите исходный текст');
        return;
    }
    
    const noteData = {
        id: state.editingNote ? state.editingNote.id : Date.now(),
        title: state.editingNote ? state.editingNote.title : 'Новый конспект',
        originalText: sourceText,
        smartText: smartText,
        date: new Date().toISOString().split('T')[0]
    };
    
    if (state.editingNote) {
        // Обновление существующего конспекта
        const noteIndex = state.currentFolder.notes.findIndex(n => n.id === state.editingNote.id);
        if (noteIndex !== -1) {
            state.currentFolder.notes[noteIndex] = noteData;
            state.currentNote = noteData;
        }
    } else {
        // Создание нового конспекта
        state.currentFolder.notes.push(noteData);
        state.currentNote = noteData;
    }
    
    // Показываем модальное окно успешного сохранения
    showSuccessModal(`Конспект "${noteData.title}" успешно ${state.editingNote ? 'обновлен' : 'сохранен'}!`);
    
    // Возвращаемся к просмотру конспекта
    showNoteView();
    renderNotes();
    renderFolders();
    updateStats();
}

// Сохранение конспекта из режима просмотра
function saveNoteFromView() {
    if (!state.currentNote || !elements.noteTextContent) return;
    
    const newContent = elements.noteTextContent.innerHTML;
    state.currentNote.smartText = newContent;
    state.currentNote.date = new Date().toISOString().split('T')[0];
    
    showSuccessModal('Конспект успешно сохранен!');
    renderNotes();
    updateStats();
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

function autoSaveNote() {
    if (!state.currentNote || !elements.noteTextContent) return;
    
    const newContent = elements.noteTextContent.innerHTML;
    if (newContent !== state.currentNote.smartText) {
        state.currentNote.smartText = newContent;
        state.currentNote.date = new Date().toISOString().split('T')[0];
        showAutoSaveIndicator();
    }
}

function showAutoSaveIndicator() {
    // Удаляем существующий индикатор
    const existingIndicator = document.querySelector('.auto-save-indicator');
    if (existingIndicator) existingIndicator.remove();
    
    const indicator = document.createElement('div');
    indicator.className = 'auto-save-indicator';
    indicator.innerHTML = '<i class="fas fa-check"></i> Автосохранение';
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        indicator.remove();
    }, 2000);
}

// Функция для показа модального окна успеха
function showSuccessModal(message) {
    // Создаем модальное окно, если его еще нет
    let successModal = document.getElementById('successModal');
    
    if (!successModal) {
        successModal = document.createElement('div');
        successModal.id = 'successModal';
        successModal.className = 'modal';
        successModal.innerHTML = `
            <div class="modal-content">
                <h3>Успешно!</h3>
                <div class="modal-text">
                    <p>${message}</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-confirm" id="closeSuccess">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(successModal);
        
        // Обработчик для кнопки OK
        document.getElementById('closeSuccess').addEventListener('click', () => {
            successModal.style.display = 'none';
        });
        
        // Закрытие при клике вне модального окна
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.style.display = 'none';
            }
        });
    } else {
        // Обновляем сообщение, если модальное окно уже существует
        successModal.querySelector('.modal-text p').textContent = message;
    }
    
    successModal.style.display = 'block';
}

// Скачивание из режима просмотра
function downloadNoteFromView() {
    if (!state.currentNote) return;
    
    const content = `
${state.currentNote.title.toUpperCase()}
${'='.repeat(state.currentNote.title.length)}

УМНЫЙ КОНСПЕКТ:
---------------
${state.currentNote.smartText}

Создано в "Умном организаторе конспектов"
${new Date().toLocaleString('ru-RU')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.currentNote.title}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Обработка загрузки изображения с ML
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        await handleImageUploadAI(event);
    }
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
    if (elements.userName) elements.userName.value = state.user.name;
    if (elements.userEmail) elements.userEmail.value = state.user.email;
    if (elements.userPassword) elements.userPassword.value = '';
    if (elements.confirmPassword) elements.confirmPassword.value = '';
    if (elements.dropdownContent) elements.dropdownContent.classList.remove('show');
    if (elements.settingsModal) elements.settingsModal.style.display = 'block';
}

function hideSettingsModal() {
    if (elements.settingsModal) elements.settingsModal.style.display = 'none';
}

function saveSettings() {
    const newName = elements.userName ? elements.userName.value.trim() : '';
    const newEmail = elements.userEmail ? elements.userEmail.value.trim() : '';
    const newPassword = elements.userPassword ? elements.userPassword.value : '';
    const confirmPassword = elements.confirmPassword ? elements.confirmPassword.value : '';
    
    if (!newName) {
        alert('Пожалуйста, введите имя пользователя');
        return;
    }
    
    if (!newEmail) {
        alert('Пожалуйста, введите email');
        return;
    }
    
    if (newPassword && newPassword !== confirmPassword) {
        alert('Пароли не совпадают');
        return;
    }
    
    state.user.name = newName;
    state.user.email = newEmail;
    
    if (newPassword) {
        // В реальном приложении здесь будет хэширование пароля
        alert('Пароль успешно изменен!');
    }
    
    alert('Настройки сохранены!');
    hideSettingsModal();
    
    // Обновляем отображение имени пользователя
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) userNameElement.textContent = newName;
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
        alert('Выход выполнен');
        if (elements.dropdownContent) elements.dropdownContent.classList.remove('show');
        showHomeView();
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);