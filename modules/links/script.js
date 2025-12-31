
const STORAGE_KEY = 'lms_links_data';
const SETTINGS_KEY = 'lms_links_categories';

export default {
    data: [],
    sortCol: 'title',
    sortAsc: true,
    isGlobalEditMode: false,
    searchQuery: '',
    container: null,
    categories: ['일반', '자료', '참고', '기타'],

    async init(container) {
        this.container = container;
        this.loadData();
        this.loadSettings();
        this.render();
        this.bindEvents();
    },

    loadData() {
        const raw = localStorage.getItem(STORAGE_KEY);
        this.data = raw ? JSON.parse(raw) : [];
    },

    loadSettings() {
        const types = localStorage.getItem(SETTINGS_KEY);
        if (types) {
            this.categories = JSON.parse(types);
        }
    },

    saveSettings() {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.categories));
        this.renderTypeManagerList();
        this.render();
    },

    saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.render();
    },

    bindEvents() {
        // Add Button
        const addBtn = this.container.querySelector('#addBtn');
        if (addBtn) addBtn.onclick = () => this.addItem();

        // Type Manager Button
        const typeManagerBtn = this.container.querySelector('#typeManagerBtn');
        if (typeManagerBtn) typeManagerBtn.onclick = () => this.openTypeManager();

        // Modal Close
        const closeBtn = this.container.querySelector('#closeTypeManagerBtn');
        if (closeBtn) closeBtn.onclick = () => this.closeTypeManager();

        // Modal Add Type Button
        const addNewTypeBtn = this.container.querySelector('#addNewTypeBtn');
        if (addNewTypeBtn) addNewTypeBtn.onclick = () => this.addTypeFromModal();

        // Modal Input Enter
        const newTypeInput = this.container.querySelector('#newTypeInput');
        if (newTypeInput) {
            newTypeInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.addTypeFromModal();
            }
        }

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

    // Category Management
    openTypeManager() {
        const modal = this.container.querySelector('#typeManagerModal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderTypeManagerList();
        }
    },

    closeTypeManager() {
        const modal = this.container.querySelector('#typeManagerModal');
        if (modal) modal.style.display = 'none';
        this.render();
    },

    addTypeFromModal() {
        const input = this.container.querySelector('#newTypeInput');
        const newType = input.value.trim();

        if (newType && !this.categories.includes(newType)) {
            this.categories.push(newType);
            this.saveSettings();
            input.value = '';
        } else if (this.categories.includes(newType)) {
            alert('이미 존재하는 카테고리입니다.');
        }
    },

    deleteType(type) {
        if (confirm(`"${type}" 카테고리를 삭제하시겠습니까? (데이터는 유지됩니다)`)) {
            this.categories = this.categories.filter(t => t !== type);
            this.saveSettings();
        }
    },

    editType(oldType) {
        const newType = prompt("수정할 카테고리 이름을 입력하세요:", oldType);
        if (newType && newType !== oldType) {
            if (this.categories.includes(newType)) {
                alert('이미 존재하는 이름입니다.');
                return;
            }
            // Update List
            const idx = this.categories.indexOf(oldType);
            if (idx !== -1) {
                this.categories[idx] = newType;
            }

            // Update Existing Items
            let dataChanged = false;
            this.data.forEach(item => {
                if (item.category === oldType) {
                    item.category = newType;
                    dataChanged = true;
                }
            });

            this.saveSettings();
            if (dataChanged) this.saveData();
        }
    },

    renderTypeManagerList() {
        const list = this.container.querySelector('#typeList');
        if (!list) return;

        list.innerHTML = this.categories.map(type => `
            <li style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:0.5rem 1rem; border-radius:6px;">
                <span>${type}</span>
                <div>
                    <button class="icon-btn" onclick="app.activeModule.editType('${type}')" style="color:var(--primary-color); font-size:0.9rem; margin-right:4px;" title="이름 수정"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn" onclick="app.activeModule.deleteType('${type}')" style="color:#f85149; font-size:0.9rem" title="삭제"><i class="fa-solid fa-trash"></i></button>
                </div>
            </li>
        `).join('');
    },

    addItem() {
        const getVal = (id) => this.container.querySelector(`#${id}`).value;
        const newItem = {
            id: Date.now(),
            title: getVal('inp_title'),
            category: getVal('inp_category'),
            url: getVal('inp_url'),
            note: getVal('inp_note')
        };

        if (!newItem.title || !newItem.url) {
            alert('제목과 링크 URL은 필수입니다.');
            return;
        }

        this.data.push(newItem);
        this.saveData();

        // Clear inputs
        ['inp_title', 'inp_url', 'inp_note'].forEach(id => {
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
        const tbody = this.container.querySelector('#linkTableBody');
        const countBadge = this.container.querySelector('#countBadge');
        const typeSelect = this.container.querySelector('#inp_category');

        if (!tbody) return;

        // Render Category Options
        if (typeSelect) {
            const currentVal = typeSelect.value;
            typeSelect.innerHTML = this.categories.map(t => `<option value="${t}">${t}</option>`).join('');
            if (this.categories.includes(currentVal)) typeSelect.value = currentVal;
            else if (this.categories.length > 0 && !currentVal) typeSelect.value = this.categories[0];
        }

        const displayData = this.getSortedFilteredData();
        if (countBadge) countBadge.textContent = `(${displayData.length})`;

        tbody.innerHTML = displayData.map(item => {
            const isEditing = this.isGlobalEditMode;

            const getOptions = (currentVal) => {
                return this.categories.map(t =>
                    `<option value="${t}" ${t === currentVal ? 'selected' : ''}>${t}</option>`
                ).join('');
            };

            if (isEditing) {
                return `
                    <tr class="editing-row" data-id="${item.id}">
                        <td><input type="text" value="${item.title}" data-field="title"></td>
                        <td>
                            <select data-field="category">
                                ${getOptions(item.category)}
                            </select>
                        </td>
                        <td><input type="text" value="${item.url}" data-field="url"></td>
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
                        <td><strong>${item.title}</strong></td>
                        <td><span class="badge" style="background-color:${this.getColorForType(item.category)}; padding:4px 8px; border-radius:12px; font-size:0.8rem; color:#fff">${item.category}</span></td>
                        <td class="link-cell">
                            ${this.renderLink(item.url)}
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
            tbody.querySelectorAll('input, select').forEach(input => {
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

    getColorForType(type) {
        const presets = {
            '일반': '#238636',
            '자료': '#1f6feb',
            '참고': '#a371f7',
            '기타': '#8b949e'
        };
        if (presets[type]) return presets[type];

        let hash = 0;
        for (let i = 0; i < type.length; i++) {
            hash = type.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 60%, 50%)`;
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
