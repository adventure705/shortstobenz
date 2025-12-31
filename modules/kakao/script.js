
const STORAGE_KEY = 'lms_kakao_data';

export default {
    data: [],
    sortCol: 'date',
    sortAsc: false,
    isGlobalEditMode: false,
    searchQuery: '',
    container: null,

    async init(container) {
        this.container = container;
        this.loadData();
        this.render();
        this.bindEvents();
    },

    loadData() {
        const raw = localStorage.getItem(STORAGE_KEY);
        this.data = raw ? JSON.parse(raw) : [];
    },

    saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.render();
    },

    bindEvents() {
        // Add Button
        const addBtn = this.container.querySelector('#addBtn');
        if (addBtn) addBtn.onclick = () => this.addItem();

        // Sort Headers
        this.container.querySelectorAll('th[data-sort]').forEach(th => {
            th.onclick = () => {
                const col = th.dataset.sort;
                if (this.sortCol === col) {
                    this.sortAsc = !this.sortAsc;
                } else {
                    this.sortCol = col;
                    this.sortAsc = true;
                }
                this.render();
            };
        });

        // Global Edit Toggle
        const toggleEdit = this.container.querySelector('#toggleEditModeBtn');
        if (toggleEdit) toggleEdit.onclick = () => {
            this.isGlobalEditMode = !this.isGlobalEditMode;
            toggleEdit.innerHTML = this.isGlobalEditMode
                ? '<i class="fa-solid fa-check"></i> 편집 완료'
                : '<i class="fa-solid fa-pen"></i> 전체 수정 모드';
            toggleEdit.classList.toggle('btn-primary', this.isGlobalEditMode);
            this.render();
        };
    },

    addItem() {
        const getVal = (id) => this.container.querySelector(`#${id}`).value;
        const newItem = {
            id: Date.now(),
            date: getVal('inp_date'),
            link: getVal('inp_link'),
            note: getVal('inp_note')
        };

        if (!newItem.date || !newItem.link) {
            alert('날짜와 릴리즈 링크는 필수입니다.');
            return;
        }

        this.data.push(newItem);
        this.saveData();

        // Clear inputs
        ['inp_date', 'inp_link', 'inp_note'].forEach(id => {
            const el = this.container.querySelector(`#${id}`);
            if (el) el.value = '';
        });
    },

    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.render();
    },

    getSortedFilteredData() {
        let filtered = this.data;

        if (this.searchQuery) {
            filtered = filtered.filter(item => {
                return Object.values(item).some(val =>
                    String(val).toLowerCase().includes(this.searchQuery)
                );
            });
        }

        return filtered.sort((a, b) => {
            const valA = a[this.sortCol] || '';
            const valB = b[this.sortCol] || '';

            if (valA < valB) return this.sortAsc ? -1 : 1;
            if (valA > valB) return this.sortAsc ? 1 : -1;
            return 0;
        });
    },

    render() {
        const tbody = this.container.querySelector('#kakaoTableBody');
        const countBadge = this.container.querySelector('#countBadge');

        if (!tbody) return;

        const displayData = this.getSortedFilteredData();
        if (countBadge) countBadge.textContent = `(${displayData.length})`;

        tbody.innerHTML = displayData.map(item => {
            const isEditing = this.isGlobalEditMode;

            if (isEditing) {
                return `
                    <tr class="editing-row" data-id="${item.id}">
                        <td><input type="date" value="${item.date}" data-field="date"></td>
                        <td><input type="text" value="${item.link}" data-field="link"></td>
                        <td><input type="text" value="${item.note}" data-field="note"></td>
                        <td class="actions-cell">
                           <button class="icon-btn" onclick="app.activeModule.saveRow(${item.id})"><i class="fa-solid fa-check" style="color:var(--primary-color)"></i></button>
                           <button class="icon-btn" onclick="app.activeModule.deleteItem(${item.id})"><i class="fa-solid fa-trash" style="color:#f85149"></i></button>
                        </td>
                    </tr>
                `;
            } else {
                return `
                    <tr data-id="${item.id}">
                        <td>${item.date}</td>
                        <td class="link-cell">
                            ${this.renderLink(item.link)}
                        </td>
                        <td>${item.note}</td>
                        <td class="actions-cell">
                            <button class="icon-btn" title="수정" onclick="app.activeModule.toggleRowEdit(${item.id})"><i class="fa-solid fa-pen"></i></button>
                            <button class="icon-btn" title="삭제" onclick="app.activeModule.deleteItem(${item.id})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }
        }).join('');

        // Re-attach event listeners for inputs if in global edit mode
        if (this.isGlobalEditMode) {
            tbody.querySelectorAll('input').forEach(input => {
                input.onchange = (e) => {
                    const tr = e.target.closest('tr');
                    const id = Number(tr.dataset.id);
                    const field = e.target.dataset.field;
                    this.updateItemField(id, field, e.target.value);
                };
            });
        }
    },

    renderLink(url) {
        if (!url) return '-';
        let safeUrl = url.trim();
        if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
            safeUrl = 'http://' + safeUrl;
        }
        return `
            <a href="${safeUrl}" target="_blank" title="${safeUrl}"><i class="fa-solid fa-link"></i> 링크 열기</a>
            <button class="icon-btn" onclick="app.activeModule.copyToClipboard('${url}')" style="font-size:0.8em; margin-left:4px;" title="복사"><i class="fa-regular fa-copy"></i></button>
        `;
    },

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('링크가 복사되었습니다!');
        });
    },

    toggleRowEdit(id) {
        this.isGlobalEditMode = true;
        this.render();
    },

    saveRow(id) {
        this.isGlobalEditMode = false;
        // Reset toggle button
        const toggleEdit = this.container.querySelector('#toggleEditModeBtn');
        if (toggleEdit) {
            toggleEdit.innerHTML = '<i class="fa-solid fa-pen"></i> 전체 수정 모드';
            toggleEdit.classList.remove('btn-primary');
        }
        this.render();
    },

    updateItemField(id, field, value) {
        const idx = this.data.findIndex(i => i.id === id);
        if (idx > -1) {
            this.data[idx][field] = value;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        }
    },

    deleteItem(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.data = this.data.filter(i => i.id !== id);
            this.saveData();
        }
    }
};
