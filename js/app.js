/**
 * @description App State & Mock Database / Estado de la Aplicación y Base de Datos Simulada
 */
const DB_KEYS = {
    USERS: 'titan_users',
    CLASSES: 'titan_classes',
    PAYMENTS: 'titan_payments',
    NOTICES: 'titan_notices',
    CURRENT_USER: 'titan_current_user',
    RESERVATIONS: 'titan_reservations',
    PRODUCTS: 'titan_products',
    ORDERS: 'titan_orders',
    PROGRESS: 'titan_progress',
    MAINTENANCE: 'titan_maintenance',
    STAFF_INCIDENTS: 'titan_staff_incidents'
};

/**
 * @description Initialize Dummy Data / Inicializar datos de demostración
 */
function initDB() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
        const users = [
            { id: 1, name: 'Admin', role: 'admin', user: 'admin', pass: 'admin' },
            { id: 2, name: 'Juan Perez', role: 'client', user: 'user', pass: 'user', plan: 'Gold', photo: 'https://via.placeholder.com/150' },
            { id: 3, name: 'Maria Gomez', role: 'client', user: 'maria', pass: 'maria', plan: 'Platinum', photo: 'https://via.placeholder.com/150' }
        ];
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    }

    if (!localStorage.getItem(DB_KEYS.CLASSES)) {
        const classes = [
            { id: 1, name: 'CrossFit', time: '07:00 AM', instructor: 'Coach Mike', spots: 15 },
            { id: 2, name: 'Natación', time: '09:00 AM', instructor: 'Coach Sarah', spots: 8 },
            { id: 3, name: 'Yoga', time: '06:00 PM', instructor: 'Coach Zen', spots: 20 },
            { id: 4, name: 'Boxeo', time: '08:00 PM', instructor: 'Coach Rocky', spots: 12 }
        ];
        localStorage.setItem(DB_KEYS.CLASSES, JSON.stringify(classes));
    }

    if (!localStorage.getItem(DB_KEYS.NOTICES)) {
        const notices = [
            { id: 1, title: 'Mantenimiento Alberca', content: 'La alberca estará cerrada el Domingo.', date: '2023-10-25', type: 'warning' },
            { id: 2, title: 'Nueva Clase', content: 'Iniciamos clases de Box el próximo mes.', date: '2023-10-26', type: 'info' }
        ];
        localStorage.setItem(DB_KEYS.NOTICES, JSON.stringify(notices));
    }

    if (!localStorage.getItem(DB_KEYS.PRODUCTS) || localStorage.getItem(DB_KEYS.PRODUCTS).includes('via.placeholder')) {
        const products = [
            { id: 1, name: 'Proteína Whey (Vainilla)', price: 45, image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=200&auto=format&fit=crop' },
            { id: 2, name: 'Agua Mineral 1L', price: 15, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=200&auto=format&fit=crop' },
            { id: 3, name: 'Barra Energética', price: 25, image: 'https://images.unsplash.com/photo-1622484211148-713216503b41?q=80&w=200&auto=format&fit=crop' },
            { id: 4, name: 'Toalla Titan', price: 150, image: 'https://images.unsplash.com/photo-1522933115033-060144b6c6b3?q=80&w=200&auto=format&fit=crop' }
        ];
        localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(products));
    }

    // Initialize empty reservations/orders/progress if not exist
    if (!localStorage.getItem(DB_KEYS.RESERVATIONS)) localStorage.setItem(DB_KEYS.RESERVATIONS, JSON.stringify([]));
    if (!localStorage.getItem(DB_KEYS.ORDERS)) localStorage.setItem(DB_KEYS.ORDERS, JSON.stringify([]));
    if (!localStorage.getItem(DB_KEYS.PROGRESS)) localStorage.setItem(DB_KEYS.PROGRESS, JSON.stringify([]));
    if (!localStorage.getItem(DB_KEYS.MAINTENANCE)) localStorage.setItem(DB_KEYS.MAINTENANCE, JSON.stringify([]));
    if (!localStorage.getItem(DB_KEYS.STAFF_INCIDENTS)) localStorage.setItem(DB_KEYS.STAFF_INCIDENTS, JSON.stringify([]));
}

/**
 * @description User Authentication / Autenticación de Usuario
 */
function login(username, password) {
    const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS));
    const user = users.find(u => u.user === username && u.pass === password);

    if (user) {
        localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
        return user;
    }
    return null;
}

function logout() {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    window.location.href = 'index.html';
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER));
}

// Data Access
function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function addPayment(file, note) {
    const payments = getData(DB_KEYS.PAYMENTS);
    const user = getCurrentUser();
    const newPayment = {
        id: Date.now(),
        userId: user.id,
        userName: user.name,
        date: new Date().toLocaleDateString(),
        note: note,
        status: 'pending',
        fileName: file.name
    };
    payments.push(newPayment);
    saveData(DB_KEYS.PAYMENTS, payments);
}

// --- NEW FEATURES LOGIC ---

// 1. Reservations
function bookClass(classId, userId) {
    const classes = getData(DB_KEYS.CLASSES);
    const reservations = getData(DB_KEYS.RESERVATIONS);

    const clsIndex = classes.findIndex(c => c.id === classId);
    if (clsIndex === -1) return { success: false, message: 'Clase no encontrada' };

    if (classes[clsIndex].spots <= 0) return { success: false, message: 'Clase llena' };

    // Check if already booked
    const alreadyBooked = reservations.some(r => r.classId === classId && r.userId === userId);
    if (alreadyBooked) return { success: false, message: 'Ya has reservado esta clase' };

    // Update spots
    classes[clsIndex].spots -= 1;
    saveData(DB_KEYS.CLASSES, classes);

    // Add reservation
    reservations.push({
        id: Date.now(),
        classId: classId,
        userId: userId,
        className: classes[clsIndex].name,
        classTime: classes[clsIndex].time,
        date: new Date().toLocaleDateString()
    });
    saveData(DB_KEYS.RESERVATIONS, reservations);

    return { success: true, message: 'Reserva exitosa' };
}

function cancelBooking(reservationId) {
    const reservations = getData(DB_KEYS.RESERVATIONS);
    const resIndex = reservations.findIndex(r => r.id === reservationId);

    if (resIndex === -1) return { success: false, message: 'Reserva no encontrada' };

    const reservation = reservations[resIndex];

    // Restore spot
    const classes = getData(DB_KEYS.CLASSES);
    const clsIndex = classes.findIndex(c => c.id === reservation.classId);
    if (clsIndex !== -1) {
        classes[clsIndex].spots += 1;
        saveData(DB_KEYS.CLASSES, classes);
    }

    // Remove reservation
    reservations.splice(resIndex, 1);
    saveData(DB_KEYS.RESERVATIONS, reservations);

    return { success: true, message: 'Reserva cancelada' };
}

function getUserReservations(userId) {
    const reservations = getData(DB_KEYS.RESERVATIONS);
    return reservations.filter(r => r.userId === userId);
}

// 2. Store
function placeOrder(userId, items, total) {
    const orders = getData(DB_KEYS.ORDERS);
    orders.push({
        id: Date.now(),
        userId: userId,
        items: items, // Array of product objects
        total: total,
        date: new Date().toLocaleString(),
        status: 'completed' // Mock successful payment
    });
    saveData(DB_KEYS.ORDERS, orders);
    return { success: true, message: 'Pedido realizado con éxito' };
}

// 3. Progress
function getUserProgress(userId) {
    const progress = getData(DB_KEYS.PROGRESS);
    return progress.filter(p => p.userId === userId).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function addProgressEntry(userId, value, date) {
    const progress = getData(DB_KEYS.PROGRESS);
    progress.push({
        id: Date.now(),
        userId: userId,
        value: parseFloat(value),
        date: date
    });
    saveData(DB_KEYS.PROGRESS, progress);
    return { success: true, message: 'Progreso registrado' };
}

// --- ADMIN FEATURES LOGIC ---

// 1. Admin Reservations
function cancelReservationAdmin(reservationId) {
    const reservations = getData(DB_KEYS.RESERVATIONS);
    const resIndex = reservations.findIndex(r => r.id === reservationId);

    if (resIndex === -1) return { success: false, message: 'Reserva no encontrada' };

    const reservation = reservations[resIndex];

    // Restore spot
    const classes = getData(DB_KEYS.CLASSES);
    const clsIndex = classes.findIndex(c => c.id === reservation.classId);
    if (clsIndex !== -1) {
        classes[clsIndex].spots += 1;
        saveData(DB_KEYS.CLASSES, classes);
    }

    // Remove reservation
    reservations.splice(resIndex, 1);
    saveData(DB_KEYS.RESERVATIONS, reservations);

    return { success: true, message: 'Reserva eliminada por Admin' };
}

// 2. Admin Orders
function getAllOrders() {
    return getData(DB_KEYS.ORDERS).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function updateOrderStatus(orderId, status) {
    const orders = getData(DB_KEYS.ORDERS);
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        saveData(DB_KEYS.ORDERS, orders);
        return { success: true, message: 'Estado de pedido actualizado' };
    }
    return { success: false, message: 'Pedido no encontrado' };
}

// 3. Admin Inventory
function updateProduct(productId, newPrice, newStock) { // Stock is simulated for now as it's not in DB schema yet
    const products = getData(DB_KEYS.PRODUCTS);
    const prod = products.find(p => p.id === productId);
    if (prod) {
        prod.price = parseFloat(newPrice);
        // In a real app we would have stock. For now we just update price.
        saveData(DB_KEYS.PRODUCTS, products);
        return { success: true, message: 'Producto actualizado' };
    }
    return { success: false, message: 'Producto no encontrado' };
}

// 4. Simulation Tools
function simulateWeek() {
    // 1. Generate random reservations
    const classes = getData(DB_KEYS.CLASSES);
    const users = getData(DB_KEYS.USERS).filter(u => u.role === 'client');
    const reservations = getData(DB_KEYS.RESERVATIONS);

    // Create 5 random reservations
    for (let i = 0; i < 5; i++) {
        const randomClass = classes[Math.floor(Math.random() * classes.length)];
        const randomUser = users[Math.floor(Math.random() * users.length)];

        if (randomClass.spots > 0) {
            randomClass.spots--;
            reservations.push({
                id: Date.now() + i, // slight offset for unique IDs
                classId: randomClass.id,
                userId: randomUser.id,
                className: randomClass.name,
                classTime: randomClass.time,
                date: new Date().toLocaleDateString()
            });
        }
    }
    saveData(DB_KEYS.CLASSES, classes);
    saveData(DB_KEYS.RESERVATIONS, reservations);

    // 2. Generate random orders
    const products = getData(DB_KEYS.PRODUCTS);
    const orders = getData(DB_KEYS.ORDERS);

    // Create 3 random orders
    for (let i = 0; i < 3; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomProduct = products[Math.floor(Math.random() * products.length)];

        orders.push({
            id: Date.now() + i + 100,
            userId: randomUser.id,
            items: [{ name: randomProduct.name, price: randomProduct.price }],
            total: randomProduct.price,
            date: new Date().toLocaleString(),
            status: 'pending'
        });
    }
    saveData(DB_KEYS.ORDERS, orders);

    return { success: true, message: 'Semana simulada: Se crearon reservas y pedidos.' };
}

function simulateMonth() {
    // 1. Generate 100 Users
    const users = getData(DB_KEYS.USERS);
    // Only generate if we have less than 10 users to avoid infinite growth on multiple clicks
    if (users.length < 10) {
        const startId = users.length + 1;
        const newUsers = [];

        for (let i = 0; i < 100; i++) {
            newUsers.push({
                id: startId + i,
                name: `Cliente ${startId + i}`,
                role: 'client',
                user: `user${startId + i}`,
                pass: 'pass',
                plan: Math.random() > 0.7 ? 'Platinum' : 'Gold',
                photo: 'https://via.placeholder.com/150'
            });
        }
        users.push(...newUsers);
        saveData(DB_KEYS.USERS, users);
    }
    const clientUsers = users.filter(u => u.role === 'client');

    // 2. Generate Activity for Last 30 Days
    const products = getData(DB_KEYS.PRODUCTS);
    const classes = getData(DB_KEYS.CLASSES);

    const orders = [];
    const reservations = [];
    const maintenance = [];
    const staffIncidents = [];
    const payments = []; // New: Membership payments

    for (let d = 30; d >= 0; d--) { // Loop from 30 days ago to today
        const date = new Date();
        date.setDate(date.getDate() - d);
        const dateStr = date.toLocaleDateString();

        // A. Membership Payments (Renewals)
        // Assume some users renew on this day
        if (d % 30 === 0 || Math.random() > 0.9) { // Monthly renewals + random new joiners
            const renewalsCount = Math.floor(Math.random() * 5) + 1;
            for (let r = 0; r < renewalsCount; r++) {
                const randomUser = clientUsers[Math.floor(Math.random() * clientUsers.length)];
                const amount = randomUser.plan === 'Platinum' ? 100 : (randomUser.plan === 'Gold' ? 70 : 40);

                payments.push({
                    id: Date.now() + d + r + 5000,
                    userId: randomUser.id,
                    userName: randomUser.name,
                    date: dateStr,
                    note: 'Renovación Mensualidad ' + randomUser.plan,
                    status: 'approved',
                    fileName: 'comprobante_auto.pdf',
                    amount: amount // Added amount for chart
                });
            }
        }

        // B. Orders (Sales)
        // More sales on weekends (Fri-Sun)
        const dayOfWeek = date.getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5);
        const dailyOrdersCount = Math.floor(Math.random() * (isWeekend ? 15 : 8)) + 3;

        for (let o = 0; o < dailyOrdersCount; o++) {
            const randomUser = clientUsers[Math.floor(Math.random() * clientUsers.length)];
            const randomProduct = products[Math.floor(Math.random() * products.length)];

            orders.push({
                id: Date.now() - (d * 86400000) + o,
                userId: randomUser.id,
                items: [{ name: randomProduct.name, price: randomProduct.price }],
                total: randomProduct.price,
                date: dateStr + ' ' + date.toLocaleTimeString(),
                status: 'delivered'
            });
        }

        // C. Reservations (Attendance & Absences)
        classes.forEach((cls, idx) => {
            // Random attendance for past classes
            if (d > 0) {
                const attendeesCount = Math.floor(Math.random() * cls.spots * 0.8) + 2; // Simulated fullness
                for (let k = 0; k < attendeesCount; k++) {
                    const randomUser = clientUsers[Math.floor(Math.random() * clientUsers.length)];
                    reservations.push({
                        id: Date.now() + (d * cls.id * 100) + k,
                        classId: cls.id,
                        userId: randomUser.id,
                        className: cls.name,
                        classTime: cls.time,
                        date: dateStr,
                        status: Math.random() > 0.1 ? 'attended' : 'absent' // 10% absentee rate
                    });
                }
            } else {
                // Future/Today reservations (Pending)
                const spotsToFill = Math.floor(Math.random() * (cls.spots - 1));
                cls.spots -= spotsToFill; // Update real spots for today
                for (let s = 0; s < spotsToFill; s++) {
                    const randomUser = clientUsers[Math.floor(Math.random() * clientUsers.length)];
                    reservations.push({
                        id: Date.now() + cls.id * 10000 + s,
                        classId: cls.id,
                        userId: randomUser.id,
                        className: cls.name,
                        classTime: cls.time,
                        date: dateStr,
                        status: 'pending'
                    });
                }
            }
        });

        // D. Maintenance Logs (Periodic)
        if (Math.random() > 0.85) { // ~15% chance per day
            const tasks = ['Limpieza Profunda Alberca', 'Mantenimiento Caminadoras', 'Reparación AC', 'Lavado de Toallas', 'Sanitización General'];
            maintenance.push({
                id: Date.now() + d,
                task: tasks[Math.floor(Math.random() * tasks.length)],
                date: dateStr,
                cost: Math.floor(Math.random() * 200) + 50,
                technician: 'Servicios Externos S.A.'
            });
        }

        // E. Staff Incidents
        if (Math.random() > 0.95) { // ~5% chance per day
            const incidents = ['Retardo Instructor', 'Ausencia Limpieza', 'Falta Instructor Yoga', 'Equipo de sonido falló'];
            staffIncidents.push({
                id: Date.now() + d + 500,
                type: 'incident',
                description: incidents[Math.floor(Math.random() * incidents.length)],
                date: dateStr,
                resolved: true
            });
        }
    }

    saveData(DB_KEYS.ORDERS, orders);
    saveData(DB_KEYS.RESERVATIONS, reservations);
    saveData(DB_KEYS.PAYMENTS, payments); // Save simulated payments
    saveData(DB_KEYS.MAINTENANCE, maintenance);
    saveData(DB_KEYS.STAFF_INCIDENTS, staffIncidents);
    saveData(DB_KEYS.CLASSES, classes); // Updated spots for today

    return { success: true, message: 'Simulación Total Completada: Ingresos (Membresías + Tienda), Reservas e Incidentes generados.' };
}

function resetData() {
    localStorage.removeItem(DB_KEYS.RESERVATIONS);
    localStorage.removeItem(DB_KEYS.MAINTENANCE);
    localStorage.removeItem(DB_KEYS.STAFF_INCIDENTS);
    // Reset users but keep admin and demo users
    const initialUsers = [
        { id: 1, name: 'Admin', role: 'admin', user: 'admin', pass: 'admin' },
        { id: 2, name: 'Juan Perez', role: 'client', user: 'user', pass: 'user', plan: 'Gold', photo: 'https://via.placeholder.com/150' },
        { id: 3, name: 'Maria Gomez', role: 'client', user: 'maria', pass: 'maria', plan: 'Platinum', photo: 'https://via.placeholder.com/150' }
    ];
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(initialUsers));

    initDB();
    return { success: true, message: 'Datos reiniciados de fábrica.' };
}

// UI Helpers
initDB();

/**
 * @section Physical Progress / Progreso Físico
 * Handles member body measurements tracking
 * Gestiona el seguimiento de medidas corporales de los socios
 */
function getUserProgress(userId) {
    const progress = getData(DB_KEYS.PROGRESS);
    return progress.filter(p => p.userId === userId);
}

function addProgressEntry(userId, value, date) {
    const progress = getData(DB_KEYS.PROGRESS);
    progress.push({
        id: Date.now(),
        userId: userId,
        value: parseFloat(value),
        date: date
    });
    saveData(DB_KEYS.PROGRESS, progress);
}

/**
 * @section Store Orders / Pedidos de Tienda
 * Processes simulated e-commerce orders
 * Procesa pedidos de e-commerce simulado
 */
function placeOrder(userId, items, total) {
    const orders = getData(DB_KEYS.ORDERS);
    orders.push({
        id: Date.now(),
        userId: userId,
        items: items,
        total: total,
        date: new Date().toLocaleString(),
        status: 'pending' // pending, ready, picked_up
    });
    saveData(DB_KEYS.ORDERS, orders);
}

/**
 * @section Staff Incidents / Incidentes de Staff
 * Allows staff to report absences and notifies clients
 * Permite al personal reportar ausencias y notifica a los clientes
 */
function reportIncident(instructor, description, affectedClassId) {
    const incidents = getData(DB_KEYS.STAFF_INCIDENTS);
    const incidentId = Date.now();

    incidents.push({
        id: incidentId,
        instructor: instructor,
        description: description,
        classId: affectedClassId,
        date: new Date().toLocaleString(),
        status: 'active'
    });
    saveData(DB_KEYS.STAFF_INCIDENTS, incidents);

    // Notify affected users via notices / Notificar a usuarios afectados mediante avisos
    const classes = getData(DB_KEYS.CLASSES);
    const cls = classes.find(c => c.id == affectedClassId);

    if (cls) {
        const notices = getData(DB_KEYS.NOTICES);
        notices.unshift({
            id: Date.now(),
            title: `¡ALERTA!: Cambios en la clase de ${cls.name}`,
            content: `El instructor ${instructor} reporta: "${description}". Por favor revisa alternativas.`,
            date: new Date().toLocaleDateString(),
            type: 'warning'
        });
        saveData(DB_KEYS.NOTICES, notices);
    }
}
