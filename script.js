// Theme switching functionality
const themeBtn = document.getElementById('themeBtn');
const themeMenu = document.getElementById('themeMenu');
const themeOptions = document.querySelectorAll('.theme-option');
const body = document.body;

// Available themes
const themes = ['light', 'dark', 'ocean', 'forest', 'sunset', 'midnight'];
const themeIcons = ['☀️', '🌙', '🌊', '🌲', '🌅', '⭐'];

// Get current theme from localStorage
let currentTheme = localStorage.getItem('selectedTheme') || 'light';

// Apply theme on page load
function applyTheme(themeName) {
    // Remove all theme classes
    body.classList.remove('dark-theme', 'ocean-theme', 'forest-theme', 'sunset-theme', 'midnight-theme');
    
    // Add new theme class if not light
    if (themeName !== 'light') {
        body.classList.add(`${themeName}-theme`);
    }
    
    // Update button icon
    const themeIndex = themes.indexOf(themeName);
    themeBtn.textContent = themeIcons[themeIndex];
    themeBtn.title = `Текущая тема: ${themeName}`;
    
    // Update active state in menu
    themeOptions.forEach(option => {
        if (option.dataset.theme === themeName) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Save to localStorage
    localStorage.setItem('selectedTheme', themeName);
    currentTheme = themeName;
}

// Initialize theme on page load
applyTheme(currentTheme);

// Toggle theme menu on button click
themeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    themeMenu.classList.toggle('active');
});

// Theme option selection
themeOptions.forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedTheme = option.dataset.theme;
        applyTheme(selectedTheme);
        themeMenu.classList.remove('active');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-switcher')) {
        themeMenu.classList.remove('active');
    }
});

// ===== PROFILE AND PAYMENT FUNCTIONALITY =====
const profileBtn = document.getElementById('profileBtn');
const profileModal = document.getElementById('profileModal');
const paymentModal = document.getElementById('paymentModal');
const thankYouPage = document.getElementById('thankYouPage');
const authBtn = document.getElementById('authBtn');
const authEmail = document.getElementById('authEmail');
const authUsername = document.getElementById('authUsername');
const authPassword = document.getElementById('authPassword');
const loginModeBtn = document.getElementById('loginModeBtn');
const registerModeBtn = document.getElementById('registerModeBtn');
const authTitle = document.getElementById('authTitle');
const authNote = document.getElementById('authNote');
const buyBtn = document.getElementById('buyBtn');
const backBtn = document.getElementById('backBtn');
const closeButtons = document.querySelectorAll('.close');

let currentUser = null;
let authMode = 'login';

// Load user from localStorage
function parsePaymentDate(dateString) {
    if (!dateString) return null;
    if (dateString.includes('.')) {
        const [day, month, year] = dateString.split('.').map(part => parseInt(part, 10));
        return new Date(year, month - 1, day);
    }
    return new Date(dateString);
}

function loadUser() {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        if (currentUser.subscription && currentUser.subscription.purchaseDate && currentUser.subscription.purchaseDate !== '—') {
            const purchaseDate = parsePaymentDate(currentUser.subscription.purchaseDate);
            currentUser.subscription.daysRemaining = purchaseDate ? calculateDaysRemaining(purchaseDate.toISOString()) : 0;
        } else if (currentUser.subscription) {
            currentUser.subscription.daysRemaining = 0;
        }
        updateProfileUI();
        updateBuyButtonState();
    }
}

// Generate unique IDs
function generateAccountId() {
    return 'ACC-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let key = '';
    for (let i = 0; i < 20; i++) {
        if (i > 0 && i % 4 === 0) key += '-';
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// Save user to localStorage with full subscription data
function getUserData(email) {
    const stored = localStorage.getItem(`user_${email}`);
    return stored ? JSON.parse(stored) : null;
}

function persistUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem(`user_${user.email}`, JSON.stringify(user));
    if (user.subscription) {
        localStorage.setItem(`subscription_${user.email}`, JSON.stringify(user.subscription));
    }
    if (user.purchases) {
        localStorage.setItem(`purchases_${user.email}`, JSON.stringify(user.purchases));
    }
}

function registerUser(email, username, password) {
    if (getUserData(email)) {
        return { success: false, error: 'Пользователь с таким email уже существует.' };
    }

    const registrationDate = new Date();
    currentUser = {
        email: email,
        username: username,
        password: password,
        accountId: generateAccountId(),
        licenseKey: generateLicenseKey(),
        registrationDate: registrationDate.toLocaleDateString('ru-RU'),
        registrationTime: registrationDate.toISOString(),
        subscription: {
            plan: 'BurmaldaVizuals Pro',
            status: 'expired',
            purchaseDate: '—',
            expiryDate: '—',
            daysRemaining: 0
        },
        purchases: []
    };

    persistUser(currentUser);
    return { success: true };
}

function loginUser(email, password) {
    const userData = getUserData(email);
    if (!userData) {
        return { success: false, error: 'Пользователь не найден. Зарегистрируйтесь.' };
    }
    if (userData.password !== password) {
        return { success: false, error: 'Неверный пароль. Попробуйте снова.' };
    }

    currentUser = userData;
    if (currentUser.subscription && currentUser.subscription.purchaseDate && currentUser.subscription.purchaseDate !== '—') {
        const purchaseDate = parsePaymentDate(currentUser.subscription.purchaseDate);
        currentUser.subscription.daysRemaining = purchaseDate ? calculateDaysRemaining(purchaseDate.toISOString()) : 0;
    }
    persistUser(currentUser);
    updateBuyButtonState();
    return { success: true };
}

function saveUser(email, username, password) {
    const registrationDate = new Date();
    const existingUser = getUserData(email);
    const existingPurchases = existingUser?.purchases || [];
    const existingSubscription = existingUser?.subscription || {
        plan: 'BurmaldaVizuals Pro',
        status: 'expired',
        purchaseDate: '—',
        expiryDate: '—',
        daysRemaining: 0
    };

    currentUser = {
        email: email,
        username: username,
        password: password,
        accountId: existingUser?.accountId || generateAccountId(),
        licenseKey: existingUser?.licenseKey || generateLicenseKey(),
        registrationDate: existingUser?.registrationDate || registrationDate.toLocaleDateString('ru-RU'),
        registrationTime: existingUser?.registrationTime || registrationDate.toISOString(),
        subscription: existingSubscription,
        purchases: existingPurchases
    };

    persistUser(currentUser);
}

// Calculate days remaining
function calculateDaysRemaining(purchaseDate) {
    const purchase = new Date(purchaseDate);
    const expiry = new Date(purchase);
    expiry.setFullYear(expiry.getFullYear() + 1); // 1 year subscription
    
    const today = new Date();
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff > 0 ? daysDiff : 0;
}

function updateBuyButtonState() {
    if (!currentUser || !currentUser.subscription) {
        buyBtn.disabled = false;
        buyBtn.textContent = '💳 Купить через PayPal';
        buyBtn.style.cursor = 'pointer';
        buyBtn.style.opacity = '1';
        return;
    }

    const hasPurchasedItems = currentUser.purchases && currentUser.purchases.length > 0;
    const isActive = hasPurchasedItems && (currentUser.subscription.daysRemaining > 0 || currentUser.subscription.status === 'active');
    if (isActive) {
        buyBtn.disabled = true;
        buyBtn.textContent = '🎟️ Подписка активна';
        buyBtn.style.cursor = 'not-allowed';
        buyBtn.style.opacity = '0.65';
    } else {
        buyBtn.disabled = false;
        buyBtn.textContent = '💳 Купить через PayPal';
        buyBtn.style.cursor = 'pointer';
        buyBtn.style.opacity = '1';
    }
}

// Update profile UI with all data
function updateProfileUI() {
    if (currentUser) {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('profileInfo').style.display = 'block';
        
        // Basic info
        document.getElementById('profileUsername').textContent = currentUser.username;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('registrationDate').textContent = `Зарегистрирован(а): ${currentUser.registrationDate}`;
        
        // Account info
        document.getElementById('accountId').textContent = currentUser.accountId;
        document.getElementById('licenseKey').textContent = currentUser.licenseKey;
        
        // Subscription info
        const purchasesList = document.getElementById('purchasesList');
        purchasesList.innerHTML = '';
        const subscription = currentUser.subscription || {
            plan: 'BurmaldaVizuals Pro',
            status: 'expired',
            purchaseDate: '—',
            expiryDate: '—',
            daysRemaining: 0
        };
        const hasPurchasedItems = currentUser.purchases && currentUser.purchases.length > 0;
        const hasActiveSubscription = hasPurchasedItems && subscription.daysRemaining > 0;

        if (hasPurchasedItems) {
            currentUser.purchases.forEach((purchase) => {
                const item = document.createElement('div');
                item.className = 'purchase-item';
                item.innerHTML = `
                    <p><strong>📦 ${purchase.name}</strong></p>
                    <p>Дата покупки: <strong>${new Date(purchase.date).toLocaleDateString('ru-RU')}</strong></p>
                    <p>Стоимость: <strong>$${purchase.price}</strong></p>
                    <p>Действительна до: <strong>${new Date(purchase.expiryDate).toLocaleDateString('ru-RU')}</strong></p>
                    <p>Статус: <strong style="color: ${purchase.daysRemaining > 0 ? '#28a745' : '#dc3545'};">${purchase.daysRemaining > 0 ? '🟢 Активна' : '🔴 Истекла'}</strong></p>
                `;
                purchasesList.appendChild(item);
            });
        } else if (hasActiveSubscription) {
            const item = document.createElement('div');
            item.className = 'purchase-item';
            item.innerHTML = `
                <p><strong>📦 Активная подписка BurmaldaVizuals Pro</strong></p>
                <p>Дата начала: <strong>${subscription.purchaseDate}</strong></p>
                <p>Действительна до: <strong>${subscription.expiryDate}</strong></p>
                <p>Статус: <strong style="color: #28a745;">🟢 Активна</strong></p>
            `;
            purchasesList.appendChild(item);
        } else {
            purchasesList.innerHTML = '<p style="text-align: center; color: var(--text-light);">У вас пока нет покупок</p>';
        }

        document.getElementById('downloadSection').style.display = hasPurchasedItems ? 'block' : 'none';
        
        document.getElementById('purchaseDate').textContent = subscription.purchaseDate;
        document.getElementById('expiryDate').textContent = subscription.expiryDate;
        document.getElementById('daysRemaining').textContent = `${subscription.daysRemaining} дней`;
        
        if (subscription.daysRemaining > 0) {
            document.getElementById('subscriptionStatus').className = 'status-badge status-active';
            document.getElementById('subscriptionStatus').textContent = '🟢 Активна';
        } else {
            document.getElementById('subscriptionStatus').className = 'status-badge status-expired';
            document.getElementById('subscriptionStatus').textContent = '🔴 Нет активной подписки';
        }
    }
}

function setAuthMode(mode) {
    authMode = mode;
    if (mode === 'login') {
        loginModeBtn.classList.add('active');
        registerModeBtn.classList.remove('active');
        authTitle.textContent = '🎮 Войти в BurmaldaVizuals';
        authNote.textContent = 'Введите email и пароль для доступа к кабинету.';
        authBtn.textContent = 'Войти';
        authUsername.style.display = 'none';
    } else {
        loginModeBtn.classList.remove('active');
        registerModeBtn.classList.add('active');
        authTitle.textContent = '🎮 Регистрация в BurmaldaVizuals';
        authNote.textContent = 'Создайте аккаунт, чтобы сохранить покупки и ссылки для загрузки.';
        authBtn.textContent = 'Зарегистрироваться';
        authUsername.style.display = 'block';
    }
}

loginModeBtn.addEventListener('click', () => setAuthMode('login'));
registerModeBtn.addEventListener('click', () => setAuthMode('register'));

// Initialize auth mode
setAuthMode('login');

// Auth button
authBtn.addEventListener('click', () => {
    const email = authEmail.value.trim();
    const username = authUsername.value.trim();
    const password = authPassword.value.trim();
    if (!email || !email.includes('@') || !password) {
        alert('Пожалуйста, заполните email и пароль верно.');
        return;
    }

    if (authMode === 'login') {
        const result = loginUser(email, password);
        if (!result.success) {
            alert(result.error);
            return;
        }
    } else {
        if (!username) {
            alert('Пожалуйста, укажите имя (никнейм).');
            return;
        }
        const result = registerUser(email, username, password);
        if (!result.success) {
            alert(result.error);
            return;
        }
    }

    updateProfileUI();
    updateBuyButtonState();
    document.getElementById('paymentEmail').textContent = email;
    localStorage.setItem('tempEmail', email);
    localStorage.setItem('tempUsername', currentUser.username);
});

// Logout button
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('tempEmail');
        localStorage.removeItem('tempUsername');
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('profileInfo').style.display = 'none';
        authEmail.value = '';
        authUsername.value = '';
    });
}

// Support button
const supportBtn = document.getElementById('supportBtn');
if (supportBtn) {
    supportBtn.addEventListener('click', () => {
        alert('Свяжитесь с нами: kshapkonikolay@gmail.com\n\nМы ответим в течение 24 часов!');
    });
}

// Profile button
profileBtn.addEventListener('click', () => {
    loadUser();
    profileModal.classList.add('show');
});


buyBtn.addEventListener('click', () => {
    if (!currentUser) {
        alert('Пожалуйста, войдите или зарегистрируйтесь в кабинете перед покупкой.');
        profileModal.classList.add('show');
        return;
    }

    const hasActiveSubscription = currentUser.subscription && (currentUser.subscription.status === 'active' || currentUser.subscription.daysRemaining > 0);
    if (hasActiveSubscription) {
        alert('Ваша подписка уже активна. Оплата не требуется.');
        return;
    }

    document.getElementById('paymentEmail').textContent = currentUser.email;
    document.getElementById('customField').value = currentUser.email;
    document.getElementById('returnUrl').value = window.location.href.split('?')[0] + '?payment_success=true';
    document.getElementById('notifyUrl').value = window.location.href.split('?')[0] + '?payment_notify=true';
    paymentModal.classList.add('show');
});

// Close modals
closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.remove('show');
    });
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        profileModal.classList.remove('show');
    }
    if (e.target === paymentModal) {
        paymentModal.classList.remove('show');
    }
});

// Back button
backBtn.addEventListener('click', () => {
    thankYouPage.style.display = 'none';
    window.location.hash = '#home';
});

// Check for payment success
function checkPaymentSuccess() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
        const email = localStorage.getItem('tempEmail');
        const username = localStorage.getItem('tempUsername');
        if (email && username) {
            const now = new Date();
            const expiry = new Date(now);
            expiry.setFullYear(expiry.getFullYear() + 1);
            const subscription = {
                plan: 'BurmaldaVizuals Pro',
                status: 'active',
                purchaseDate: now.toLocaleDateString('ru-RU'),
                expiryDate: expiry.toLocaleDateString('ru-RU'),
                daysRemaining: calculateDaysRemaining(now.toISOString())
            };

            currentUser = getUserData(email) || currentUser || {
                email: email,
                username: username,
                accountId: generateAccountId(),
                licenseKey: generateLicenseKey(),
                registrationDate: new Date().toLocaleDateString('ru-RU'),
                registrationTime: new Date().toISOString(),
                subscription: subscription,
                purchases: []
            };

            currentUser.subscription = subscription;
            currentUser.purchases = currentUser.purchases || [];
            currentUser.purchases.push({
                name: 'BurmaldaVizuals Pro',
                price: '2.00',
                date: now.toISOString(),
                expiryDate: expiry.toISOString(),
                daysRemaining: subscription.daysRemaining,
                link: 'https://drive.google.com/drive/folders/1minecraft-visuals'
            });

            // Save to localStorage
            persistUser(currentUser);
            updateBuyButtonState();

            // Show thank you page
            document.getElementById('thankYouEmail').textContent = email;
            thankYouPage.style.display = 'flex';

            // Clear temp data
            localStorage.removeItem('tempEmail');
            localStorage.removeItem('tempUsername');
            window.history.replaceState({}, document.title, window.location.pathname);

            updateProfileUI();
        }
    }
}

// Check for payment on page load
window.addEventListener('load', () => {
    loadUser();
    checkPaymentSuccess();
});

// Keyboard shortcut for theme switcher (Press 'T' key)
document.addEventListener('keydown', function(e) {
    if (e.key === 't' || e.key === 'T') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            themeBtn.click();
        }
    }
});

// Add scroll effect to header
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > 50) {
        header.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.boxShadow = 'var(--shadow)';
    }
});

// Log info
console.log('%c🎮 BurmaldaVizuals Loaded!', 'color: #2d5016; font-size: 14px; font-weight: bold;');
console.log('%cТемы: Нажми T или кнопку 🌙 | Кабинет: Кнопка 👤 | Оплата: PayPal', 'color: #3d7a1e; font-size: 12px;');
