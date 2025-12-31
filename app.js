
const defaultSidebar = [
    {
        id: 'lectures',
        icon: 'fa-regular fa-folder-open',
        name: '강의 모음집',
        path: './modules/lectures/view.html',
        jsPath: './modules/lectures/script.js'
    },
    {
        id: 'links',
        icon: 'fa-solid fa-link',
        name: '링크 모음집',
        path: './modules/links/view.html',
        jsPath: './modules/links/script.js'
    },
    {
        id: 'kakao',
        icon: 'fa-solid fa-comment',
        name: '카톡 모음집',
        path: './modules/kakao/view.html',
        jsPath: './modules/kakao/script.js'
    }
];

class App {
    constructor() {
        this.navItems = JSON.parse(localStorage.getItem('lms_sidebar_items')) || defaultSidebar;

        // Auto-add new modules for existing users if missing
        if (!this.navItems.find(i => i.id === 'links')) {
            this.navItems.push(defaultSidebar.find(i => i.id === 'links'));
            localStorage.setItem('lms_sidebar_items', JSON.stringify(this.navItems));
        }

        if (!this.navItems.find(i => i.id === 'kakao')) {
            this.navItems.push(defaultSidebar.find(i => i.id === 'kakao'));
            localStorage.setItem('lms_sidebar_items', JSON.stringify(this.navItems));
        }

        this.sidebarNav = document.getElementById('sidebarNav');
        this.contentArea = document.getElementById('contentArea');
        this.pageTitle = document.getElementById('pageTitle');
        this.isEditingSidebar = false;

        // Modules cache to store running instances if needed, or just function references
        this.activeModule = null;

        this.init();
    }

    init() {
        this.renderSidebar();
        this.setupEventListeners();

        // Auto load first item if exists
        if (this.navItems.length > 0) {
            this.loadModule(this.navItems[0].id);
        }
    }

    setupEventListeners() {
        // Sidebar Edit Toggle
        document.getElementById('editSidebarBtn').addEventListener('click', () => {
            this.toggleSidebarEdit();
        });

        // Global Search (can be passed to active module)
        document.getElementById('globalSearchInput').addEventListener('input', (e) => {
            if (this.activeModule && this.activeModule.handleSearch) {
                this.activeModule.handleSearch(e.target.value);
            }
        });
    }

    renderSidebar() {
        this.sidebarNav.innerHTML = '';
        this.navItems.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'nav-item';
            div.dataset.id = item.id;
            div.draggable = this.isEditingSidebar;

            // Icon
            const icon = document.createElement('i');
            icon.className = item.icon || 'fa-solid fa-circle';
            div.appendChild(icon);

            // Name (Text or Input)
            if (this.isEditingSidebar) {
                const input = document.createElement('input');
                input.value = item.name;
                input.addEventListener('change', (e) => {
                    item.name = e.target.value;
                    this.saveSidebar();
                });
                input.addEventListener('click', (e) => e.stopPropagation()); // Prevent loading module
                div.appendChild(input);

                // Reorder handles could go here if using a library, but native HTML5 drag is ok
                div.addEventListener('dragstart', (e) => this.handleDragStart(e, index));
                div.addEventListener('dragover', (e) => e.preventDefault());
                div.addEventListener('drop', (e) => this.handleDrop(e, index));

            } else {
                const span = document.createElement('span');
                span.textContent = item.name;
                div.appendChild(span);

                div.addEventListener('click', () => this.loadModule(item.id));
            }

            this.sidebarNav.appendChild(div);
        });

        // Save if we rendered inputs
        if (this.isEditingSidebar) {
            // Maybe add "Add New" button logic later
        }
    }

    toggleSidebarEdit() {
        this.isEditingSidebar = !this.isEditingSidebar;
        const btn = document.getElementById('editSidebarBtn');
        btn.style.color = this.isEditingSidebar ? 'var(--primary-color)' : 'var(--text-muted)';
        this.renderSidebar();
    }

    handleDragStart(e, index) {
        e.dataTransfer.setData('text/plain', index);
        e.target.classList.add('dragging');
    }

    handleDrop(e, targetIndex) {
        e.preventDefault();
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
        const draggedItem = this.navItems[draggedIndex];

        // Reorder array
        this.navItems.splice(draggedIndex, 1);
        this.navItems.splice(targetIndex, 0, draggedItem);

        this.saveSidebar();
        this.renderSidebar();
    }

    saveSidebar() {
        localStorage.setItem('lms_sidebar_items', JSON.stringify(this.navItems));
    }

    async loadModule(id) {
        if (this.isEditingSidebar) return;

        // Visual Active State
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navItem = document.querySelector(`.nav-item[data-id="${id}"]`);
        if (navItem) navItem.classList.add('active');

        const item = this.navItems.find(i => i.id === id);
        if (!item) return;

        this.pageTitle.textContent = item.name;

        try {
            // Check protocol first
            if (window.location.protocol === 'file:') {
                throw new Error('CORS_ERROR');
            }

            // Fetch HTML
            const response = await fetch(item.path);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();

            // Clean up old module
            if (this.activeModule && this.activeModule.cleanup) {
                this.activeModule.cleanup();
            }
            this.contentArea.innerHTML = html;

            // Load JS
            try {
                const module = await import(`${item.jsPath}?t=${Date.now()}`);
                if (module && module.default && typeof module.default.init === 'function') {
                    this.activeModule = module.default;
                    await this.activeModule.init(this.contentArea);
                }
            } catch (jsError) {
                console.error("Error loading module script:", jsError);
                this.contentArea.innerHTML += `<div style="color:red; padding:10px">스크립트 로딩 오류: ${jsError.message}</div>`;
            }

        } catch (error) {
            let msg = `<div class="error">모듈을 불러오는데 실패했습니다: ${error.message}</div>`;

            if (error.message === 'CORS_ERROR' || window.location.protocol === 'file:') {
                msg = `
                    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; color: #ff7b72;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; margin-bottom:1.5rem"></i>
                        <h2 style="margin-bottom:1rem; color:#fff">실행 방식 오류</h2>
                        <p style="font-size:1.1rem; line-height:1.6; color:#c9d1d9;">
                            HTML 파일을 직접 더블클릭해서 실행하셨군요!<br>
                            보안상의 이유로 모듈 로딩이 차단되어 화면이 보이지 않습니다.
                        </p>
                        <div style="background:#161b22; padding:1.5rem; border-radius:8px; margin-top:2rem; border:1px solid #30363d; text-align:left">
                            <h4 style="color:#58a6ff; margin-bottom:0.5rem">올바른 실행 방법:</h4>
                            <ol style="margin-left:1.5rem; color:#8b949e; display:flex; flex-direction:column; gap:0.5rem">
                                <li>폴더 내의 <strong style="color:#fff">start_server.bat</strong> 파일을 실행하세요.</li>
                                <li>검은색 창이 뜨면 켜두세요.</li>
                                <li>브라우저 주소창에 <strong style="color:#fff"><a href="http://localhost:8000" style="color:#58a6ff" onclick="window.location.href='http://localhost:8000'">http://localhost:8000</a></strong> 을 입력해 접속하세요.</li>
                            </ol>
                        </div>
                    </div>
                `;
            }

            this.contentArea.innerHTML = msg;
            console.error(error);
        }
    }
}

// Start App
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
