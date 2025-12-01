// auth.js
const API_URL = 'http://localhost:8000';

// Элементы DOM
const elements = {
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    forgotPasswordForm: document.getElementById('forgotPasswordForm'),

    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    showLoginFromForgot: document.getElementById('showLoginFromForgot'),
    forgotPasswordLink: document.getElementById('forgotPasswordLink'),

    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    registerConfirmPassword: document.getElementById('registerConfirmPassword'),
    forgotEmail: document.getElementById('forgotEmail'),

    successModal: document.getElementById('successModal'),
    resetSentModal: document.getElementById('resetSentModal'),
    goToLogin: document.getElementById('goToLogin'),
    closeResetModal: document.getElementById('closeResetModal'),

    passwordStrength: document.getElementById('passwordStrength'),
    strengthFill: document.getElementById('strengthFill'),
    strengthText: document.getElementById('strengthText'),

    rememberMe: document.getElementById('rememberMe')
};

// Инициализация
function initAuth() {
    setupEventListeners();
    setupPasswordStrength();
    
    // Если уже авторизован - редирект на главную
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'index.html';
    }
}

// Обработчики событий
function setupEventListeners() {
    elements.showRegister.addEventListener('click', e => { e.preventDefault(); showForm('register'); });
    elements.showLogin.addEventListener('click', e => { e.preventDefault(); showForm('login'); });
    elements.showLoginFromForgot.addEventListener('click', e => { e.preventDefault(); showForm('login'); });
    elements.forgotPasswordLink.addEventListener('click', e => { e.preventDefault(); showForm('forgot'); });

    elements.loginForm.addEventListener('submit', handleLogin);
    elements.registerForm.addEventListener('submit', handleRegister);
    elements.forgotPasswordForm.addEventListener('submit', handleForgotPassword);

    elements.goToLogin.addEventListener('click', () => { elements.successModal.style.display = 'none'; showForm('login'); });
    elements.closeResetModal.addEventListener('click', () => { elements.resetSentModal.style.display = 'none'; showForm('login'); });

    window.addEventListener('click', e => {
        if (e.target === elements.successModal) elements.successModal.style.display = 'none';
        if (e.target === elements.resetSentModal) elements.resetSentModal.style.display = 'none';
    });

    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    });
}

// Показать форму
function showForm(formName) {
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    if (formName === 'login') elements.loginForm.classList.add('active');
    if (formName === 'register') elements.registerForm.classList.add('active');
    if (formName === 'forgot') elements.forgotPasswordForm.classList.add('active');
}

// Регистрация
async function handleRegister(e) {
    e.preventDefault();

    const name = elements.registerName.value.trim();
    const email = elements.registerEmail.value.trim();
    const password = elements.registerPassword.value;
    const confirmPassword = elements.registerConfirmPassword.value;
    const acceptTerms = document.getElementById('acceptTerms').checked;

    if (!name || !validateEmail(email) || password !== confirmPassword || !acceptTerms) {
        alert('Проверьте введённые данные');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                username: email, 
                email: email, 
                name: name, 
                password: password 
            })
        });

        if (response.ok) {
            elements.successModal.style.display = 'flex';
            elements.registerForm.reset();
        } else {
            const errorData = await response.json();
            alert(errorData.detail || 'Ошибка регистрации');
        }
    } catch (err) {
        console.error('Ошибка регистрации:', err);
        alert('Ошибка соединения с сервером');
    }
}

// Логин
async function handleLogin(e) {
    e.preventDefault();

    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;

    if (!validateEmail(email) || !password) {
        alert('Введите корректные данные');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login-json`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                username: email, 
                password: password 
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Сохраняем токен и данные пользователя
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user_email', email);
            localStorage.setItem('user_name', data.username || email);
            
            // Редирект на главную
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            alert(errorData.detail || 'Неверный email или пароль');
        }
    } catch (err) {
        console.error('Ошибка входа:', err);
        alert('Ошибка соединения с сервером');
    }
}

// Восстановление пароля (только модалка)
function handleForgotPassword(e) {
    e.preventDefault();
    const email = elements.forgotEmail.value.trim();
    if (!validateEmail(email)) {
        alert('Введите корректный email');
        return;
    }
    elements.resetSentModal.style.display = 'flex';
    elements.forgotPasswordForm.reset();
}

// Сила пароля
function setupPasswordStrength() {
    elements.registerPassword.addEventListener('input', function() {
        const password = this.value;
        if (password.length > 0) showPasswordStrength(password);
        else hidePasswordStrength();
    });
}

function showPasswordStrength(password) {
    elements.passwordStrength.classList.add('show');
    let strength = 0, text = 'Слабый пароль', color = '#EF4444';
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/\d/.test(password)) strength += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
    if (strength >= 75) { text = 'Сильный пароль'; color = '#10B981'; }
    else if (strength >= 50) { text = 'Средний пароль'; color = '#F59E0B'; }

    elements.strengthFill.style.width = strength + '%';
    elements.strengthFill.style.background = color;
    elements.strengthText.textContent = text;
    elements.strengthText.style.color = color;
}

function hidePasswordStrength() {
    elements.passwordStrength.classList.remove('show');
}

// Проверка email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Запуск
document.addEventListener('DOMContentLoaded', initAuth);