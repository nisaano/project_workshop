// Состояние приложения
let authState = {
    currentForm: 'login',
    users: JSON.parse(localStorage.getItem('smartNotesUsers')) || [],
    currentUser: null
};

// Элементы DOM
const elements = {
    // Формы
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    forgotPasswordForm: document.getElementById('forgotPasswordForm'),
    
    // Кнопки переключения
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    showLoginFromForgot: document.getElementById('showLoginFromForgot'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),
    
    // Поля ввода
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    registerConfirmPassword: document.getElementById('registerConfirmPassword'),
    forgotEmail: document.getElementById('forgotEmail'),
    
    // Модальные окна
    successModal: document.getElementById('successModal'),
    resetSentModal: document.getElementById('resetSentModal'),
    goToLogin: document.getElementById('goToLogin'),
    closeResetModal: document.getElementById('closeResetModal'),
    
    // Индикатор силы пароля
    passwordStrength: document.getElementById('passwordStrength'),
    strengthFill: document.getElementById('strengthFill'),
    strengthText: document.getElementById('strengthText')
};

// Инициализация
function initAuth() {
    setupEventListeners();
    checkRememberedUser();
    setupPasswordStrength();
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Переключение форм
    elements.showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('register');
    });
    
    elements.showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('login');
    });
    
    elements.showLoginFromForgot.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('login');
    });
    
    elements.forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('forgot');
    });
    
    // Отправка форм
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    
    // Модальные окна
    elements.goToLogin.addEventListener('click', () => {
        elements.successModal.style.display = 'none';
        showForm('login');
    });
    
    elements.closeResetModal.addEventListener('click', () => {
        elements.resetSentModal.style.display = 'none';
        showForm('login');
    });
    
    // Переключение видимости пароля
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
    
    // Закрытие модальных окон
    window.addEventListener('click', (e) => {
        if (e.target === elements.successModal) {
            elements.successModal.style.display = 'none';
        }
        if (e.target === elements.resetSentModal) {
            elements.resetSentModal.style.display = 'none';
        }
    });
}

// Показать нужную форму
function showForm(formName) {
    // Скрыть все формы
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    // Показать нужную форму
    switch(formName) {
        case 'login':
            elements.loginForm.classList.add('active');
            break;
        case 'register':
            elements.registerForm.classList.add('active');
            break;
        case 'forgot':
            elements.forgotPasswordForm.classList.add('active');
            break;
    }
    
    authState.currentForm = formName;
}

// Обработка входа
function handleLogin(e) {
    e.preventDefault();
    
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Валидация
    if (!validateEmail(email)) {
        showError(elements.loginEmail, 'Введите корректный email');
        return;
    }
    
    if (!password) {
        showError(elements.loginPassword, 'Введите пароль');
        return;
    }
    
    // Поиск пользователя
    const user = authState.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        // Сохраняем данные пользователя
        authState.currentUser = user;
        
        if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify({ email }));
        } else {
            localStorage.removeItem('rememberedUser');
        }
        
        // Сохраняем текущую сессию
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // Перенаправляем на главную страницу
        window.location.href = 'index.html';
    } else {
        showError(elements.loginEmail, 'Неверный email или пароль');
        showError(elements.loginPassword, 'Неверный email или пароль');
    }
}

// Обработка регистрации
function handleRegister(e) {
    e.preventDefault();
    
    const name = elements.registerName.value.trim();
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value;
    const confirmPassword = elements.registerConfirmPassword.value;
    const acceptTerms = document.getElementById('acceptTerms').checked;
    
    // Валидация
    if (!name) {
        showError(elements.registerName, 'Введите имя и фамилию');
        return;
    }
    
    if (!validateEmail(email)) {
        showError(elements.registerEmail, 'Введите корректный email');
        return;
    }
    
    if (authState.users.find(u => u.email === email)) {
        showError(elements.registerEmail, 'Пользователь с таким email уже существует');
        return;
    }
    
    if (password.length < 6) {
        showError(elements.registerPassword, 'Пароль должен содержать минимум 6 символов');
        return;
    }
    
    if (password !== confirmPassword) {
        showError(elements.registerConfirmPassword, 'Пароли не совпадают');
        return;
    }
    
    if (!acceptTerms) {
        alert('Необходимо принять условия использования');
        return;
    }
    
    // Создание пользователя
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password, // В реальном приложении пароль должен хэшироваться
        createdAt: new Date().toISOString(),
        folders: [
            { 
                name: 'Мои конспекты', 
                notes: [
                    {
                        id: 1,
                        title: 'Добро пожаловать!',
                        originalText: 'Это ваш первый конспект. Вы можете редактировать его или создать новый с помощью AI-редактора.',
                        smartText: '<div class="note-content"><div class="note-section"><h4>Добро пожаловать в Умный организатор конспектов!</h4><p>Это ваш первый конспект. Вы можете:</p><ul class="note-points"><li>Редактировать этот текст</li><li>Создавать новые конспекты с помощью AI</li><li>Организовывать конспекты по папкам</li><li>Скачивать конспекты в текстовом формате</li></ul></div></div>',
                        date: new Date().toISOString().split('T')[0]
                    }
                ]
            }
        ]
    };
    
    // Сохраняем пользователя
    authState.users.push(newUser);
    localStorage.setItem('smartNotesUsers', JSON.stringify(authState.users));
    
    // Показываем модальное окно успеха
    elements.successModal.style.display = 'flex';
    
    // Очищаем форму
    elements.registerForm.reset();
    hidePasswordStrength();
}

// Обработка восстановления пароля
function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = elements.forgotEmail.value.trim();
    
    if (!validateEmail(email)) {
        showError(elements.forgotEmail, 'Введите корректный email');
        return;
    }
    
    // В реальном приложении здесь будет отправка email
    // Для демонстрации просто показываем модальное окно
    elements.resetSentModal.style.display = 'flex';
    elements.forgotPasswordForm.reset();
}

// Настройка индикатора силы пароля
function setupPasswordStrength() {
    elements.registerPassword.addEventListener('input', function() {
        const password = this.value;
        if (password.length > 0) {
            showPasswordStrength(password);
        } else {
            hidePasswordStrength();
        }
    });
}

function showPasswordStrength(password) {
    elements.passwordStrength.classList.add('show');
    
    let strength = 0;
    let text = 'Слабый пароль';
    let color = '#EF4444';
    
    // Проверка длины
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    
    // Проверка на наличие цифр
    if (/\d/.test(password)) strength += 25;
    
    // Проверка на наличие специальных символов
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
    
    // Определение текста и цвета
    if (strength >= 75) {
        text = 'Сильный пароль';
        color = '#10B981';
    } else if (strength >= 50) {
        text = 'Средний пароль';
        color = '#F59E0B';
    }
    
    elements.strengthFill.style.width = strength + '%';
    elements.strengthFill.style.background = color;
    elements.strengthText.textContent = text;
    elements.strengthText.style.color = color;
}

function hidePasswordStrength() {
    elements.passwordStrength.classList.remove('show');
}

// Валидация email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Показать ошибку
function showError(inputElement, message) {
    // Убираем предыдущие ошибки
    hideError(inputElement);
    
    // Добавляем класс ошибки
    inputElement.parentElement.classList.add('error');
    
    // Создаем сообщение об ошибке
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message show';
    errorElement.textContent = message;
    
    inputElement.parentElement.parentElement.appendChild(errorElement);
}

// Скрыть ошибку
function hideError(inputElement) {
    inputElement.parentElement.classList.remove('error');
    
    const existingError = inputElement.parentElement.parentElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

// Проверка запомненного пользователя
function checkRememberedUser() {
    const remembered = localStorage.getItem('rememberedUser');
    if (remembered) {
        const userData = JSON.parse(remembered);
        elements.loginEmail.value = userData.email;
        document.getElementById('rememberMe').checked = true;
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', initAuth);
// Функция для успешного входа (добавьте в конец auth.js)
function handleSuccessfulLogin(user) {
    // Сохраняем пользователя в sessionStorage
    sessionStorage.setItem('currentUser', JSON.stringify({
        email: user.email,
        name: user.name
    }));
    
    // Перенаправляем на главную страницу
    window.location.href = 'index.html';
}

// Обновите функцию handleLogin в auth.js:
function handleLogin(e) {
    e.preventDefault();
    
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Валидация
    if (!validateEmail(email)) {
        showError(elements.loginEmail, 'Введите корректный email');
        return;
    }
    
    if (!password) {
        showError(elements.loginPassword, 'Введите пароль');
        return;
    }
    
    // Поиск пользователя
    const user = authState.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        if (rememberMe) {
            localStorage.setItem('rememberedUser', JSON.stringify({ email }));
        } else {
            localStorage.removeItem('rememberedUser');
        }
        
        handleSuccessfulLogin(user);
    } else {
        showError(elements.loginEmail, 'Неверный email или пароль');
        showError(elements.loginPassword, 'Неверный email или пароль');
    }
}