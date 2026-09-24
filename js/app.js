document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const loginScreen = document.getElementById('loginScreen');
    const dashboardScreen = document.getElementById('dashboardScreen');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginError = document.getElementById('loginError');

    const ALLOWED_ADMINS = ['minesof.oficial@gmail.com'];

    window.auth.onAuthStateChanged(user => {
        if (user) {
            // VERIFICACIÓN ESTRICTA EN EL FRONTEND
            if (!ALLOWED_ADMINS.includes(user.email.toLowerCase())) {
                window.auth.signOut();
                loginError.textContent = "Acceso Denegado: Esta cuenta no tiene privilegios de Máster.";
                loginError.style.display = 'block';
                return;
            }
            
            document.getElementById('userEmailDisplay').textContent = user.email;
            loginScreen.style.display = 'none';
            dashboardScreen.style.display = 'block';
            loadTenants();
        } else {
            loginScreen.style.display = 'flex';
            dashboardScreen.style.display = 'none';
            document.getElementById('tenantsTableBody').innerHTML = '';
        }
    });

    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const pwd = document.getElementById('loginPassword').value.trim();
        if(!email || !pwd) return;

        loginBtn.textContent = "Ingresando...";
        loginError.style.display = 'none';

        try {
            await window.auth.signInWithEmailAndPassword(email, pwd);
        } catch(e) {
            console.error(e);
            loginError.textContent = "Error: Credenciales inválidas o no tienes permisos.";
            loginError.style.display = 'block';
        } finally {
            loginBtn.textContent = "Ingresar al Panel";
        }
    });

    logoutBtn.addEventListener('click', () => {
        window.auth.signOut();
    });
});

async function loadTenants() {
    const tbody = document.getElementById('tenantsTableBody');
    const loading = document.getElementById('loadingIndicator');
    
    try {
        const snapshot = await db.collection('tenants').orderBy('createdAt', 'desc').get();
        loading.style.display = 'none';
        
        document.getElementById('totalUsersCount').textContent = snapshot.docs.length;
        
        tbody.innerHTML = '';
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement('tr');
            
            const isSuspended = data.status === 'suspended';
            const statusBadge = isSuspended 
                ? `<span class="badge-suspended">Suspendido</span>` 
                : `<span class="badge-active">Activo</span>`;
                
            const actionBtn = isSuspended ? `<button class='btn btn-success btn-sm' onclick='toggleTenantStatus("${doc.id}", "active")'>Reactivar</button>` : `<button class='btn btn-danger btn-sm' onclick='toggleTenantStatus("${doc.id}", "suspended")'>Bloquear</button>`;
            const statsBtn = `<button class='btn btn-primary btn-sm' style='margin-left: 10px;' onclick='viewTenantStats("${doc.id}", "${data.email}")'>Ver Actividad</button>`;

            let dateStr = 'N/A';
            if(data.createdAt && data.createdAt.toDate) {
                dateStr = data.createdAt.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            }

            tr.innerHTML = `
                <td style="font-weight: 600;">${data.email || 'Sin correo'}</td>
                <td style="color: #64748b;">${dateStr}</td>
                <td>${statusBadge}</td>
                <td>${actionBtn} ${statsBtn}</td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch(e) {
        console.error("Error loading tenants:", e);
        loading.textContent = "Error al cargar los negocios. Verifica que tengas permisos de Super Administrador.";
    }
}

window.viewTenantStats = async (tenantId, email) => {
    const modal = document.getElementById('statsModal');
    const content = document.getElementById('statsContent');
    modal.style.display = 'flex';
    content.innerHTML = '<div style="text-align:center; padding:20px;">Cargando actividad de <b>' + email + '</b>...</div>';

    try {
        let totalOrders = 0;
        let totalExpenses = 0;
        let configData = null;

        const configDoc = await db.collection('tenants').doc(tenantId).collection('minesof_settings').doc('global_config').get();
        if (configDoc.exists) configData = configDoc.data();

        const ordersSnap = await db.collection('tenants').doc(tenantId).collection('minesof_orders').get();
        totalOrders = ordersSnap.size;

        const expensesSnap = await db.collection('tenants').doc(tenantId).collection('minesof_expenses').get();
        totalExpenses = expensesSnap.size;

        const totalProducts = configData && configData.products ? configData.products.length : 0;
        const totalCategories = configData && configData.categories ? configData.categories.length : 0;
        
        content.innerHTML = 
            <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin-bottom:15px;">
                <p style="margin:0 0 5px 0;"><strong>Correo:</strong>  + email + </p>
                <p style="margin:0;"><strong>Nombre Negocio:</strong>  + (configData && configData.businessName ? configData.businessName : '<i>No configurado</i>') + </p>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                <div style="border:1px solid #e2e8f0; padding:15px; border-radius:8px; text-align:center;">
                    <h2 style="margin:0; color:#2563eb;"> + totalOrders + </h2>
                    <span style="font-size:0.85rem; color:#64748b;">Ventas/Pedidos</span>
                </div>
                <div style="border:1px solid #e2e8f0; padding:15px; border-radius:8px; text-align:center;">
                    <h2 style="margin:0; color:#10b981;"> + totalProducts + </h2>
                    <span style="font-size:0.85rem; color:#64748b;">Productos Creados</span>
                </div>
                <div style="border:1px solid #e2e8f0; padding:15px; border-radius:8px; text-align:center;">
                    <h2 style="margin:0; color:#f59e0b;"> + totalCategories + </h2>
                    <span style="font-size:0.85rem; color:#64748b;">Categorías</span>
                </div>
                <div style="border:1px solid #e2e8f0; padding:15px; border-radius:8px; text-align:center;">
                    <h2 style="margin:0; color:#ef4444;"> + totalExpenses + </h2>
                    <span style="font-size:0.85rem; color:#64748b;">Egresos Registrados</span>
                </div>
            </div>
        ;
    } catch(e) {
        console.error(e);
        content.innerHTML = '<p style="color:red; text-align:center;">Error al cargar datos.<br><br>Necesitas actualizar las <b>Reglas de Seguridad de Firebase</b> para permitir al Super Administrador leer los datos de los inquilinos.</p>';
    }
};

window.toggleTenantStatus = async (tenantId, newStatus) => {
    if(!confirm(`¿Estás seguro que deseas ${newStatus === 'active' ? 'REACTIVAR' : 'BLOQUEAR'} este negocio?`)) return;
    
    try {
        await db.collection('tenants').doc(tenantId).update({
            status: newStatus
        });
        loadTenants(); // reload list
    } catch(e) {
        alert("Error al actualizar el estado: " + e.message);
    }
};
