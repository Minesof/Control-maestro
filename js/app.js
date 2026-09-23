document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const loginScreen = document.getElementById('loginScreen');
    const dashboardScreen = document.getElementById('dashboardScreen');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginError = document.getElementById('loginError');

    // ONLY THIS EMAIL CAN LOGIN TO THE MASTER PANEL
    // Ideally this is checked in Firebase Rules too, but we restrict it on frontend for simplicity here.
    const SUPER_ADMIN_EMAIL = 'admin@minesof.com'; // Adjust this to their actual email later

    window.auth.onAuthStateChanged(user => {
        if (user) {
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
                
            const actionBtn = isSuspended
                ? `<button class="btn btn-success btn-sm" onclick="toggleTenantStatus('${doc.id}', 'active')">Reactivar Acceso</button>`
                : `<button class="btn btn-danger btn-sm" onclick="toggleTenantStatus('${doc.id}', 'suspended')">Bloquear Acceso</button>`;

            let dateStr = 'N/A';
            if(data.createdAt && data.createdAt.toDate) {
                dateStr = data.createdAt.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            }

            tr.innerHTML = `
                <td style="font-weight: 600;">${data.email || 'Sin correo'}</td>
                <td style="color: #64748b;">${dateStr}</td>
                <td>${statusBadge}</td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch(e) {
        console.error("Error loading tenants:", e);
        loading.textContent = "Error al cargar los negocios. Verifica que tengas permisos de Super Administrador.";
    }
}

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
