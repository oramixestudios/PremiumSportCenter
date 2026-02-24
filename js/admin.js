// Admin Dashboard Script
// Init
const user = getCurrentUser();
if (!user || user.role !== 'admin') window.location.href = 'index.html';

// Stats
document.getElementById('totalUsers').innerText = getData(DB_KEYS.USERS).length;
document.getElementById('activeClasses').innerText = getData(DB_KEYS.CLASSES).length;

function renderPayments() {
    const payments = getData(DB_KEYS.PAYMENTS);
    const list = document.getElementById('paymentList');
    list.innerHTML = '';

    let pendingCount = 0;
    payments.forEach(p => {
        if (p.status === 'pending') {
            pendingCount++;
            const li = document.createElement('li');
            li.style.background = 'rgba(255,255,255,0.05)';
            li.style.padding = '1rem';
            li.style.marginBottom = '0.5rem';
            li.style.borderRadius = '8px';
            li.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${p.userName}</strong> <br>
                        <small>${p.date} - ${p.fileName}</small>
                        <p style="font-style: italic; color: #aaa;">"${p.note}"</p>
                    </div>
                    <div>
                        <button class="btn" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;" onclick="processPayment(${p.id}, 'approved')">✓</button>
                        <button class="btn btn-secondary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;" onclick="processPayment(${p.id}, 'rejected')">✗</button>
                    </div>
                </div>
            `;
            list.appendChild(li);
        }
    });
    document.getElementById('pendingPayments').innerText = pendingCount;
    if (pendingCount === 0) list.innerHTML = '<p style="color: #aaa;">No hay pagos pendientes.</p>';
}

function processPayment(id, status) {
    const payments = getData(DB_KEYS.PAYMENTS);
    const idx = payments.findIndex(p => p.id === id);
    if (idx !== -1) {
        payments[idx].status = status;
        saveData(DB_KEYS.PAYMENTS, payments);
        renderPayments();
        initDashboard();
        alert(`Pago ${status === 'approved' ? 'aprobado' : 'rechazado'}`);
    }
}

// DASHBOARD LOGIC
function initDashboard() {
    const orders = getData(DB_KEYS.ORDERS);
    const reservations = getData(DB_KEYS.RESERVATIONS);
    const maintenance = getData(DB_KEYS.MAINTENANCE);
    const incidents = getData(DB_KEYS.STAFF_INCIDENTS);
    const payments = getData(DB_KEYS.PAYMENTS);

    // 1. Income Chart (Orders + Memberships)
    const incomeByDay = {};

    // Sum Orders
    orders.forEach(o => {
        const day = o.date.split(' ')[0]; // dd/mm/yyyy
        incomeByDay[day] = (incomeByDay[day] || 0) + o.total;
    });

    // Sum Approved Payments (Memberships)
    payments.forEach(p => {
        if (p.status === 'approved' && p.amount) {
            const day = p.date;
            incomeByDay[day] = (incomeByDay[day] || 0) + p.amount;
        }
    });

    // Sort days
    const sortedDays = Object.keys(incomeByDay).sort((a, b) => {
        const [d1, m1, y1] = a.split('/').map(Number);
        const [d2, m2, y2] = b.split('/').map(Number);
        return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
    });

    const sortedValues = sortedDays.map(d => incomeByDay[d]);

    // Clear existing charts
    const incomeCtx = document.getElementById('incomeChart');
    if (incomeCtx) {
        if (window.incomeChartInstance) {
            window.incomeChartInstance.destroy();
        }
        window.incomeChartInstance = new Chart(incomeCtx, {
            type: 'line',
            data: {
                labels: sortedDays,
                datasets: [{
                    label: 'Ingresos Totales (Tienda + Membresías)',
                    data: sortedValues,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { responsive: true, plugins: { legend: { display: true } }, scales: { x: { display: false }, y: { grid: { color: '#333' } } } }
        });
    }

    // 2. Attendance Chart (Gym vs Pool vs Others)
    const classCounts = { 'Gym/Pesos': 0, 'Alberca': 0, 'Yoga/Otros': 0 };
    reservations.forEach(r => {
        if (r.status === 'attended' || r.status === 'pending') {
            const name = r.className.toLowerCase();
            if (name.includes('gym') || name.includes('pesas') || name.includes('fuerza')) {
                classCounts['Gym/Pesos']++;
            } else if (name.includes('alberca') || name.includes('natación') || name.includes('pool')) {
                classCounts['Alberca']++;
            } else {
                classCounts['Yoga/Otros']++;
            }
        }
    });

    const attendanceCtx = document.getElementById('attendanceChart');
    if (attendanceCtx) {
        if (window.attendanceChartInstance) {
            window.attendanceChartInstance.destroy();
        }
        window.attendanceChartInstance = new Chart(attendanceCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(classCounts),
                datasets: [{
                    label: 'Socios por Disciplina',
                    data: Object.values(classCounts),
                    backgroundColor: ['#2196F3', '#00BCD4', '#9C27B0'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
                    x: { ticks: { color: '#888' } }
                }
            }
        });
    }

    // 3. Operations Chart
    const maintCount = maintenance.length;
    const issueCount = incidents.length;
    const perfectDays = 30 - (maintCount + issueCount);

    const operationsCtx = document.getElementById('operationsChart');
    if (operationsCtx) {
        if (window.operationsChartInstance) {
            window.operationsChartInstance.destroy();
        }
        window.operationsChartInstance = new Chart(operationsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Operación Normal', 'Mantenimiento', 'Incidentes'],
                datasets: [{
                    data: [Math.max(0, perfectDays), maintCount, issueCount],
                    backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, cutout: '70%' }
        });
    }
}

function exportToCSV() {
    const rows = [];
    rows.push(['Fecha', 'Tipo', 'Detalle', 'Valor/Estado', 'Responsable']);

    // Merge all data
    const orders = getData(DB_KEYS.ORDERS).map(o => [o.date, 'Venta Tienda', o.items[0].name, `$${o.total}`, `User ${o.userId}`]);
    const payments = getData(DB_KEYS.PAYMENTS).map(p => [p.date, 'Membresía', p.note, `$${p.amount || 0}`, p.userName]);
    const reservations = getData(DB_KEYS.RESERVATIONS).map(r => [r.date, 'Reserva', r.className, r.status, `User ${r.userId}`]);
    const maintenance = getData(DB_KEYS.MAINTENANCE).map(m => [m.date, 'Mantenimiento', m.task, `-$${m.cost}`, m.technician]);
    const incidents = getData(DB_KEYS.STAFF_INCIDENTS).map(i => [i.date, 'Incidente', i.description, 'Resuelto', 'Staff']);

    rows.push(...orders, ...payments, ...reservations, ...maintenance, ...incidents);

    let csvContent = "data:text/csv;charset=utf-8,"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_titan_sports.csv");
    document.body.appendChild(link);
    link.click();
}

function handleUpdateProduct(id) {
    const newPrice = document.getElementById(`price-${id}`).value;
    const res = updateProduct(id, newPrice);
    alert(res.message);
}

// Simulation Handlers
function handleSimulate(isMassive) {
    console.log('handleSimulate called with:', isMassive);
    try {
        let res;
        if (isMassive) {
            console.log('Calling simulateMonth()...');
            res = simulateMonth();
        } else {
            console.log('Calling simulateWeek()...');
            res = simulateWeek();
        }
        console.log('Simulation result:', res);
        alert(res.message + '\n\nLa página se recargará para mostrar los nuevos datos.');
        location.reload();
    } catch (error) {
        console.error('Error in handleSimulate:', error);
        alert('Error al simular: ' + error.message);
    }
}

function handleReset() {
    if (confirm('¿ESTÁS SEGURO? Esto borrará todas las reservas, pedidos y progresos.')) {
        try {
            const res = resetData();
            alert(res.message);
            location.reload();
        } catch (error) {
            console.error('Error in handleReset:', error);
            alert('Error al reiniciar: ' + error.message);
        }
    }
}

function handlePostNotice(e) {
    e.preventDefault();
    const notices = getData(DB_KEYS.NOTICES);
    notices.unshift({
        id: Date.now(),
        title: document.getElementById('noticeTitle').value,
        content: document.getElementById('noticeContent').value,
        date: new Date().toLocaleDateString(),
        type: document.getElementById('noticeType').value
    });
    saveData(DB_KEYS.NOTICES, notices);
    alert('Aviso publicado');
    e.target.reset();
}

// Render Reservations
function renderReservations() {
    const reservations = getData(DB_KEYS.RESERVATIONS);
    const list = document.getElementById('reservationsList');
    if (!list) return;

    list.innerHTML = '';

    if (reservations.length === 0) {
        list.innerHTML = '<p style="color: #aaa;">No hay reservas.</p>';
        return;
    }

    // Show last 10 reservations
    reservations.slice(-10).reverse().forEach(r => {
        const li = document.createElement('li');
        li.style.background = 'rgba(255,255,255,0.05)';
        li.style.padding = '0.5rem';
        li.style.marginBottom = '0.5rem';
        li.style.borderRadius = '5px';
        li.innerHTML = `
            <strong>${r.className}</strong> - ${r.classTime}<br>
            <small>User ${r.userId} | ${r.date} | ${r.status || 'pending'}</small>
        `;
        list.appendChild(li);
    });
}

// Render Orders
function renderOrders() {
    const orders = getData(DB_KEYS.ORDERS);
    const list = document.getElementById('ordersList');
    if (!list) return;

    list.innerHTML = '';

    if (orders.length === 0) {
        list.innerHTML = '<p style="color: #aaa;">No hay pedidos.</p>';
        return;
    }

    // Show last 10 orders
    orders.slice(-10).reverse().forEach(o => {
        const li = document.createElement('li');
        li.style.background = 'rgba(255,255,255,0.05)';
        li.style.padding = '0.5rem';
        li.style.marginBottom = '0.5rem';
        li.style.borderRadius = '5px';
        li.innerHTML = `
            <strong>${o.items[0].name}</strong> - $${o.total}<br>
            <small>User ${o.userId} | ${o.date}</small>
        `;
        list.appendChild(li);
    });
}

// Render Inventory
function renderInventory() {
    const products = getData(DB_KEYS.PRODUCTS);
    const list = document.getElementById('inventoryList');
    if (!list) return;

    list.innerHTML = '';

    if (products.length === 0) {
        list.innerHTML = '<p style="color: #aaa;">No hay productos.</p>';
        return;
    }

    products.forEach(p => {
        const li = document.createElement('li');
        li.style.background = 'rgba(255,255,255,0.05)';
        li.style.padding = '0.5rem';
        li.style.marginBottom = '0.5rem';
        li.style.borderRadius = '5px';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.innerHTML = `
            <div>
                <strong>${p.name}</strong><br>
                <small>Precio: $${p.price}</small>
            </div>
            <div>
                <input type="number" id="price-${p.id}" value="${p.price}" 
                    style="width: 80px; padding: 0.3rem; background: rgba(0,0,0,0.3); border: 1px solid #555; color: white; border-radius: 5px;">
                <button class="btn" onclick="handleUpdateProduct(${p.id})" 
                    style="padding: 0.3rem 0.8rem; font-size: 0.8rem; margin-left: 0.5rem;">
                    Actualizar
                </button>
            </div>
        `;
        list.appendChild(li);
    });
}

// ============================================
// CONFIGURATION PANEL FUNCTIONS
// ============================================

// Toggle Config Panel
function toggleConfigPanel() {
    const panel = document.getElementById('configPanel');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        renderUsersList();
        renderClassesList();
    } else {
        panel.style.display = 'none';
    }
}

// Switch Tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });

    // Remove active class from all buttons
    document.querySelectorAll('.config-tab').forEach(btn => {
        btn.style.color = '#888';
        btn.style.borderBottom = '3px solid transparent';
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    // Activate button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    activeBtn.style.color = 'white';
    activeBtn.style.borderBottom = '3px solid var(--primary)';
    activeBtn.classList.add('active');
}

// ============================================
// USER MANAGEMENT
// ============================================

// Add User
function handleAddUser(e) {
    e.preventDefault();

    const name = document.getElementById('newUserName').value;
    const username = document.getElementById('newUserUsername').value;
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;
    const plan = document.getElementById('newUserPlan').value;
    const photo = document.getElementById('newUserPhoto').value || 'https://via.placeholder.com/150';

    const users = getData(DB_KEYS.USERS);

    // Check if username already exists
    if (users.some(u => u.user === username)) {
        alert('❌ El nombre de usuario ya existe. Por favor elige otro.');
        return;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        user: username,
        pass: password,
        role: role,
        plan: plan,
        photo: photo
    };

    users.push(newUser);
    saveData(DB_KEYS.USERS, users);

    alert(`✓ Usuario "${name}" agregado exitosamente como ${role === 'admin' ? 'Administrador' : 'Cliente'}`);

    // Clear form
    e.target.reset();

    // Reset photo preview
    document.getElementById('newUserPhoto').value = '';
    const photoPreview = document.getElementById('newUserPhotoPreview');
    const photoPlaceholder = document.getElementById('newUserPhotoPlaceholder');

    if (photoPreview) {
        photoPreview.style.display = 'none';
        photoPreview.src = '';
    }

    if (photoPlaceholder) {
        photoPlaceholder.style.display = 'flex';
    }

    // Refresh lists
    renderUsersList();
    document.getElementById('totalUsers').innerText = users.length;
}

// Delete User
function deleteUser(userId) {
    if (userId === 1) {
        alert('❌ No puedes eliminar el usuario admin principal.');
        return;
    }

    const users = getData(DB_KEYS.USERS);
    const user = users.find(u => u.id === userId);

    if (!user) return;

    if (confirm(`¿Seguro que deseas eliminar a "${user.name}"?\n\nEsto también eliminará:\n- Sus reservas\n- Sus pedidos\n- Su progreso`)) {
        // Remove user
        const updatedUsers = users.filter(u => u.id !== userId);
        saveData(DB_KEYS.USERS, updatedUsers);

        // Remove user's reservations
        const reservations = getData(DB_KEYS.RESERVATIONS).filter(r => r.userId !== userId);
        saveData(DB_KEYS.RESERVATIONS, reservations);

        // Remove user's orders
        const orders = getData(DB_KEYS.ORDERS).filter(o => o.userId !== userId);
        saveData(DB_KEYS.ORDERS, orders);

        // Remove user's progress
        const progress = getData(DB_KEYS.PROGRESS).filter(p => p.userId !== userId);
        saveData(DB_KEYS.PROGRESS, progress);

        alert(`✓ Usuario "${user.name}" eliminado correctamente.`);

        renderUsersList();
        document.getElementById('totalUsers').innerText = updatedUsers.length;
    }
}

// Render Users List
function renderUsersList(filteredUsers = null) {
    const users = filteredUsers || getData(DB_KEYS.USERS);
    const list = document.getElementById('usersList');
    if (!list) return;

    list.innerHTML = '';

    if (users.length === 0) {
        list.innerHTML = '<p style="color: #aaa; text-align: center; padding: 1rem;">No se encontraron usuarios.</p>';
        return;
    }

    users.forEach(u => {
        const li = document.createElement('li');
        li.style.background = 'rgba(255,255,255,0.05)';
        li.style.padding = '1rem';
        li.style.marginBottom = '0.5rem';
        li.style.borderRadius = '8px';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        const isAdmin = u.role === 'admin';
        const roleColor = isAdmin ? '#FF9800' : '#2196F3';
        const roleIcon = isAdmin ? 'fa-user-shield' : 'fa-user';

        li.innerHTML = `
            <div>
                <strong style="color: ${roleColor};">
                    <i class="fas ${roleIcon}"></i> ${u.name}
                </strong><br>
                <small>
                    Usuario: ${u.user} | 
                    ${isAdmin ? 'Administrador/Personal' : `Cliente (${u.plan || 'Basic'})`}
                    ${u.id === 1 ? ' | <span style="color: #FFD700;">★ Principal</span>' : ''}
                </small>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                ${u.id !== 1 ? `
                    <button class="btn" onclick="openEditModal(${u.id})" 
                        style="padding: 0.5rem 1rem; font-size: 0.7rem; background: var(--primary); color: white; border: none; border-radius: 5px;">
                        <i class="fas fa-edit"></i> EDITAR
                    </button>
                    <button class="btn" onclick="deleteUser(${u.id})" 
                        style="padding: 0.5rem 1rem; font-size: 0.7rem; background: #dc3545; color: white; border: none; border-radius: 5px;">
                        <i class="fas fa-trash"></i> ELIMINAR
                    </button>
                ` : '<small style="color: #888;">Protegido</small>'}
            </div>
        `;

        list.appendChild(li);
    });
}

// Handle User Search
function handleUserSearch() {
    const query = document.getElementById('userSearchInput').value.toLowerCase();
    const users = getData(DB_KEYS.USERS);

    const filtered = users.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.user.toLowerCase().includes(query)
    );

    renderUsersList(filtered);
}

// EDIT USER LOGIC
function openEditModal(userId) {
    const users = getData(DB_KEYS.USERS);
    const user = users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserPlan').value = user.plan || 'Basic';
    document.getElementById('editUserPhoto').value = user.photo || '';

    const preview = document.getElementById('editUserPhotoPreview');
    const placeholder = document.getElementById('editUserPhotoPlaceholder');

    if (user.photo) {
        preview.src = user.photo;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
    } else {
        preview.style.display = 'none';
        placeholder.style.display = 'flex';
    }

    document.getElementById('editUserModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editUserModal').style.display = 'none';
}

function handleEditUser(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editUserId').value);
    const users = getData(DB_KEYS.USERS);
    const idx = users.findIndex(u => u.id === id);

    if (idx !== -1) {
        users[idx].name = document.getElementById('editUserName').value;
        users[idx].plan = document.getElementById('editUserPlan').value;
        users[idx].photo = document.getElementById('editUserPhoto').value;

        saveData(DB_KEYS.USERS, users);
        alert('✓ Datos de usuario actualizados correctamente.');
        closeEditModal();
        renderUsersList();
    }
}

// ============================================
// CLASS MANAGEMENT
// ============================================

// Add Class
function handleAddClass(e) {
    e.preventDefault();

    const name = document.getElementById('newClassName').value;
    const time = document.getElementById('newClassTime').value;
    const instructor = document.getElementById('newClassInstructor').value;
    const spots = parseInt(document.getElementById('newClassSpots').value);

    const classes = getData(DB_KEYS.CLASSES);

    const newClass = {
        id: Date.now(),
        name: name,
        time: time,
        instructor: instructor,
        spots: spots
    };

    classes.push(newClass);
    saveData(DB_KEYS.CLASSES, classes);

    alert(`✓ Clase "${name}" agregada exitosamente`);

    // Clear form
    e.target.reset();

    // Refresh lists
    renderClassesList();
    document.getElementById('activeClasses').innerText = classes.length;
}

// Delete Class
function deleteClass(classId) {
    const classes = getData(DB_KEYS.CLASSES);
    const cls = classes.find(c => c.id === classId);

    if (!cls) return;

    if (confirm(`¿Seguro que deseas eliminar la clase "${cls.name}"?\n\nEsto también eliminará todas las reservas asociadas.`)) {
        // Remove class
        const updatedClasses = classes.filter(c => c.id !== classId);
        saveData(DB_KEYS.CLASSES, updatedClasses);

        // Remove class reservations
        const reservations = getData(DB_KEYS.RESERVATIONS).filter(r => r.classId !== classId);
        saveData(DB_KEYS.RESERVATIONS, reservations);

        alert(`✓ Clase "${cls.name}" eliminada correctamente.`);

        renderClassesList();
        document.getElementById('activeClasses').innerText = updatedClasses.length;
    }
}

// Render Classes List
function renderClassesList() {
    const classes = getData(DB_KEYS.CLASSES);
    const list = document.getElementById('classesList');
    if (!list) return;

    list.innerHTML = '';

    classes.forEach(c => {
        const li = document.createElement('li');
        li.style.background = 'rgba(255,255,255,0.05)';
        li.style.padding = '1rem';
        li.style.marginBottom = '0.5rem';
        li.style.borderRadius = '8px';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';

        li.innerHTML = `
            <div>
                <strong style="color: var(--primary);">
                    <i class="fas fa-dumbbell"></i> ${c.name}
                </strong><br>
                <small>
                    Horario: ${c.time} | 
                    Instructor: ${c.instructor} | 
                    Cupos: ${c.spots}
                </small>
            </div>
            <div>
                <button class="btn btn-secondary" onclick="deleteClass(${c.id})" 
                    style="padding: 0.5rem 1rem; font-size: 0.8rem; background: #FF5252;">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;

        list.appendChild(li);
    });
}

// ============================================
// IMAGE CAPTURE AND UPLOAD FUNCTIONS
// ============================================

let currentStream = null;
let currentImageTarget = null;

// Open Camera for Profile Photo
function openCamera(targetInput) {
    currentImageTarget = targetInput;

    const modal = document.createElement('div');
    modal.className = 'camera-modal';
    modal.id = 'cameraModal';
    modal.innerHTML = `
        <video id="cameraVideo" autoplay playsinline></video>
        <canvas id="cameraCanvas"></canvas>
        <div class="camera-controls">
            <button class="btn-capture" onclick="capturePhoto()">
                <i class="fas fa-camera"></i> Capturar Foto
            </button>
            <button class="btn-cancel" onclick="closeCamera()">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Access camera
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
            currentStream = stream;
            const video = document.getElementById('cameraVideo');
            video.srcObject = stream;
        })
        .catch(err => {
            console.error('Error accessing camera:', err);
            alert('❌ No se pudo acceder a la cámara. Asegúrate de dar permisos.');
            closeCamera();
        });
}

// Capture Photo from Camera
function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);

    // Set to target input
    if (currentImageTarget) {
        const preview = document.getElementById(currentImageTarget + 'Preview');
        const placeholder = document.getElementById(currentImageTarget + 'Placeholder');

        if (preview) {
            preview.src = imageData;
            preview.style.display = 'block';
        }

        if (placeholder) {
            placeholder.style.display = 'none';
        }

        // Store in hidden input
        const hiddenInput = document.getElementById(currentImageTarget);
        if (hiddenInput) {
            hiddenInput.value = imageData;
        }
    }

    closeCamera();
}

// Close Camera
function closeCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }

    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.remove();
    }

    currentImageTarget = null;
}

// Upload Image from File
function uploadImageFile(inputId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;

                // Set preview
                const preview = document.getElementById(inputId + 'Preview');
                const placeholder = document.getElementById(inputId + 'Placeholder');

                if (preview) {
                    preview.src = imageData;
                    preview.style.display = 'block';
                }

                if (placeholder) {
                    placeholder.style.display = 'none';
                }

                // Store in hidden input
                const hiddenInput = document.getElementById(inputId);
                if (hiddenInput) {
                    hiddenInput.value = imageData;
                }
            };
            reader.readAsDataURL(file);
        }
    };

    input.click();
}

// Staff Incident Handler
function handleStaffIncident(e) {
    e.preventDefault();
    const classId = document.getElementById('incidentClassId').value;
    const instructor = document.getElementById('incidentInstructor').value;
    const description = document.getElementById('incidentDescription').value;

    if (!classId) return alert('Selecciona una clase');

    reportIncident(instructor, description, classId);
    alert('✓ Incidencia registrada. Se ha publicado un aviso para los socios.');
    e.target.reset();
}

function populateIncidentClasses() {
    const classes = getData(DB_KEYS.CLASSES);
    const select = document.getElementById('incidentClassId');
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar Clase Afectada...</option>';
    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.innerText = `${c.name} (${c.time})`;
        select.appendChild(opt);
    });
}

// Initialize all displays
console.log('Admin script loaded successfully');
renderPayments();
renderReservations();
renderOrders();
renderInventory();
initDashboard();
populateIncidentClasses();
