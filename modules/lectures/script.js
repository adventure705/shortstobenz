
const STORAGE_KEY = 'lms_lectures_data';

export default {
    data: [],
    sortCol: 'date',
    sortAsc: false,
    isGlobalEditMode: false,
    searchQuery: '',
    container: null,
    filterType: '',
    filterInstructor: '',
    filterCohort: '',
    lectureTypes: ['정규강의', '특강', '숏츠 분석', '기타'],
    instructors: [],
    cohorts: [],

    unsubscribeData: null,
    unsubscribeSettings: [],

    async init(container) {
        this.container = container;
        this.bindEvents();

        // Subscribe to Settings
        this.unsubscribeSettings = [
            app.store.subscribe('lms_lecture_types', (val) => { if (val) this.lectureTypes = val; this.render(); }),
            app.store.subscribe('lms_instructors', (val) => { if (val) this.instructors = val; this.render(); }),
            app.store.subscribe('lms_cohorts', (val) => { if (val) this.cohorts = val; this.render(); })
        ];

        // Subscribe to Data
        this.unsubscribeData = app.store.subscribe(STORAGE_KEY, (val) => {
            if (val) this.data = val;
            else this.data = [];
            this.render();
        });
    },

    cleanup() {
        if (this.unsubscribeData) this.unsubscribeData();
        this.unsubscribeSettings.forEach(unsub => unsub());
    },

    // loadData and loadSettings are replaced by subscriptions

    saveSettings() {
        app.store.save('lms_lecture_types', this.lectureTypes);
        app.store.save('lms_instructors', this.instructors);
        app.store.save('lms_cohorts', this.cohorts);
        this.render();
    },

    saveData() {
        app.store.save(STORAGE_KEY, this.data);
        this.render();
    },

    bindEvents() {
        // Add Button
        const addBtn = this.container.querySelector('#addBtn');
        if (addBtn) addBtn.onclick = () => this.addItem();

        // --- Type Manager ---
        const typeManagerBtn = this.container.querySelector('#typeManagerBtn');
        if (typeManagerBtn) typeManagerBtn.onclick = () => this.openTypeManager();

        const closeTypeBtn = this.container.querySelector('#closeTypeManagerBtn');
        if (closeTypeBtn) closeTypeBtn.onclick = () => this.closeTypeManager();

        const addNewTypeBtn = this.container.querySelector('#addNewTypeBtn');
        if (addNewTypeBtn) addNewTypeBtn.onclick = () => this.addTypeFromModal();

        const newTypeInput = this.container.querySelector('#newTypeInput');
        if (newTypeInput) {
            newTypeInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.addTypeFromModal();
            }
        }

        // --- Instructor Manager ---
        const instructorManagerBtn = this.container.querySelector('#instructorManagerBtn');
        if (instructorManagerBtn) instructorManagerBtn.onclick = () => this.openInstructorManager();

        const closeInstructorBtn = this.container.querySelector('#closeInstructorManagerBtn');
        if (closeInstructorBtn) closeInstructorBtn.onclick = () => this.closeInstructorManager();

        const addNewInstructorBtn = this.container.querySelector('#addNewInstructorBtn');
        if (addNewInstructorBtn) addNewInstructorBtn.onclick = () => this.addInstructorFromModal();

        const newInstructorInput = this.container.querySelector('#newInstructorInput');
        if (newInstructorInput) {
            newInstructorInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.addInstructorFromModal();
            }
        }

        // --- Cohort Manager ---
        const cohortManagerBtn = this.container.querySelector('#cohortManagerBtn');
        if (cohortManagerBtn) cohortManagerBtn.onclick = () => this.openCohortManager();

        const closeCohortBtn = this.container.querySelector('#closeCohortManagerBtn');
        if (closeCohortBtn) closeCohortBtn.onclick = () => this.closeCohortManager();

        const addNewCohortBtn = this.container.querySelector('#addNewCohortBtn');
        if (addNewCohortBtn) addNewCohortBtn.onclick = () => this.addCohortFromModal();

        const newCohortInput = this.container.querySelector('#newCohortInput');
        if (newCohortInput) {
            newCohortInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.addCohortFromModal();
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

        // --- Filters ---
        const filterType = this.container.querySelector('#filter_type');
        if (filterType) filterType.onchange = (e) => {
            this.filterType = e.target.value;
            this.render();
        };

        const filterInstructor = this.container.querySelector('#filter_instructor');
        if (filterInstructor) filterInstructor.onchange = (e) => {
            this.filterInstructor = e.target.value;
            this.render();
        };

        const filterCohort = this.container.querySelector('#filter_cohort');
        if (filterCohort) filterCohort.onchange = (e) => {
            this.filterCohort = e.target.value;
            this.render();
        };

        const resetFiltersBtn = this.container.querySelector('#resetFiltersBtn');
        if (resetFiltersBtn) resetFiltersBtn.onclick = () => {
            this.filterType = '';
            this.filterInstructor = '';
            this.filterCohort = '';
            this.render();
        };
    },

    // --- Type Management ---
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
        const newItem = input.value.trim();
        if (newItem && !this.lectureTypes.includes(newItem)) {
            this.lectureTypes.push(newItem);
            this.saveSettings();
            input.value = '';
            this.renderTypeManagerList();
        } else if (this.lectureTypes.includes(newItem)) {
            alert('이미 존재하는 항목입니다.');
        }
    },
    deleteType(type) {
        if (confirm(`"${type}" 항목을 삭제하시겠습니까?`)) {
            this.lectureTypes = this.lectureTypes.filter(t => t !== type);
            this.saveSettings();
            this.renderTypeManagerList();
        }
    },
    renderTypeManagerList() {
        const list = this.container.querySelector('#typeList');
        if (!list) return;
        list.innerHTML = this.lectureTypes.map(t => this.createManagerItemHtml(t, 'editType', 'deleteType')).join('');
    },
    editType(oldVal) {
        const newVal = prompt("수정할 이름을 입력하세요:", oldVal);
        if (newVal && newVal !== oldVal) {
            if (this.lectureTypes.includes(newVal)) {
                alert('이미 존재하는 이름입니다.');
                return;
            }
            const idx = this.lectureTypes.indexOf(oldVal);
            if (idx !== -1) this.lectureTypes[idx] = newVal;

            // Update Data
            let changed = false;
            this.data.forEach(item => { if (item.type === oldVal) { item.type = newVal; changed = true; } });

            this.saveSettings();
            if (changed) this.saveData();
            this.renderTypeManagerList();
        }
    },

    // --- Instructor Management ---
    openInstructorManager() {
        const modal = this.container.querySelector('#instructorManagerModal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderInstructorManagerList();
        }
    },
    closeInstructorManager() {
        const modal = this.container.querySelector('#instructorManagerModal');
        if (modal) modal.style.display = 'none';
        this.render();
    },
    addInstructorFromModal() {
        const input = this.container.querySelector('#newInstructorInput');
        const newItem = input.value.trim();
        if (newItem && !this.instructors.includes(newItem)) {
            this.instructors.push(newItem);
            this.saveSettings();
            input.value = '';
            this.renderInstructorManagerList();
        } else if (this.instructors.includes(newItem)) {
            alert('이미 존재하는 항목입니다.');
        }
    },
    deleteInstructor(val) {
        if (confirm(`"${val}" 항목을 삭제하시겠습니까?`)) {
            this.instructors = this.instructors.filter(t => t !== val);
            this.saveSettings();
            this.renderInstructorManagerList();
        }
    },
    renderInstructorManagerList() {
        const list = this.container.querySelector('#instructorList');
        if (!list) return;
        list.innerHTML = this.instructors.map(t => this.createManagerItemHtml(t, 'editInstructor', 'deleteInstructor')).join('');
    },
    editInstructor(oldVal) {
        const newVal = prompt("수정할 이름을 입력하세요:", oldVal);
        if (newVal && newVal !== oldVal) {
            if (this.instructors.includes(newVal)) {
                alert('이미 존재하는 이름입니다.');
                return;
            }
            const idx = this.instructors.indexOf(oldVal);
            if (idx !== -1) this.instructors[idx] = newVal;

            // Update Data
            let changed = false;
            this.data.forEach(item => { if (item.instructor === oldVal) { item.instructor = newVal; changed = true; } });

            this.saveSettings();
            if (changed) this.saveData();
            this.renderInstructorManagerList();
        }
    },

    // --- Cohort Management ---
    openCohortManager() {
        const modal = this.container.querySelector('#cohortManagerModal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderCohortManagerList();
        }
    },
    closeCohortManager() {
        const modal = this.container.querySelector('#cohortManagerModal');
        if (modal) modal.style.display = 'none';
        this.render();
    },
    addCohortFromModal() {
        const input = this.container.querySelector('#newCohortInput');
        const newItem = input.value.trim();
        if (newItem && !this.cohorts.includes(newItem)) {
            this.cohorts.push(newItem);
            this.saveSettings();
            input.value = '';
            this.renderCohortManagerList();
        } else if (this.cohorts.includes(newItem)) {
            alert('이미 존재하는 항목입니다.');
        }
    },
    deleteCohort(val) {
        if (confirm(`"${val}" 항목을 삭제하시겠습니까?`)) {
            this.cohorts = this.cohorts.filter(t => t !== val);
            this.saveSettings();
            this.renderCohortManagerList();
        }
    },
    renderCohortManagerList() {
        const list = this.container.querySelector('#cohortList');
        if (!list) return;
        list.innerHTML = this.cohorts.map(t => this.createManagerItemHtml(t, 'editCohort', 'deleteCohort')).join('');
    },
    editCohort(oldVal) {
        const newVal = prompt("수정할 이름을 입력하세요:", oldVal);
        if (newVal && newVal !== oldVal) {
            if (this.cohorts.includes(newVal)) {
                alert('이미 존재하는 이름입니다.');
                return;
            }
            const idx = this.cohorts.indexOf(oldVal);
            if (idx !== -1) this.cohorts[idx] = newVal;

            // Update Data
            let changed = false;
            this.data.forEach(item => { if (item.cohort === oldVal) { item.cohort = newVal; changed = true; } });

            this.saveSettings();
            if (changed) this.saveData();
            this.renderCohortManagerList();
        }
    },

    // Helper for List Items
    createManagerItemHtml(value, editFn, deleteFn) {
        return `
            <li style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:0.5rem 1rem; border-radius:6px;">
                <span>${value}</span>
                <div>
                    <button class="icon-btn" onclick="app.activeModule.${editFn}('${value}')" style="color:var(--primary-color); font-size:0.9rem; margin-right:4px;" title="이름 수정"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn" onclick="app.activeModule.${deleteFn}('${value}')" style="color:#f85149; font-size:0.9rem" title="삭제"><i class="fa-solid fa-trash"></i></button>
                </div>
            </li>
        `;
    },

    // Hash function for colors
    getColorForType(type) {
        const presets = {
            '정규강의': '#238636', // Green
            '특강': '#a371f7', // Purple
            '숏츠 분석': '#f78166', // Orange
            '기타': '#8b949e' // Grey
        };
        if (presets[type]) return presets[type];
        return this.getHashColor(type);
    },

    getHashColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 60%, 50%)`;
    },

    getInstructorColor(name) {
        return this.getHashColor(name || '');
    },

    addItem() {
        const getVal = (id) => this.container.querySelector(`#${id}`).value;
        const newItem = {
            id: Date.now(),
            date: getVal('inp_date'),
            type: getVal('inp_type'),
            instructor: getVal('inp_instructor'),
            cohort: getVal('inp_cohort'),
            episode: getVal('inp_episode'),
            yt: getVal('inp_yt'),
            release: getVal('inp_release'),
            note: getVal('inp_note')
        };

        if (!newItem.date || !newItem.episode) {
            alert('날짜와 회차는 필수입니다.');
            return;
        }

        this.data.push(newItem);
        this.saveData();

        // Clear inputs
        ['inp_date', 'inp_episode', 'inp_yt', 'inp_release', 'inp_note'].forEach(id => {
            const el = this.container.querySelector(`#${id}`);
            if (el) el.value = '';
        });
        // Selects stay as they are or reset? Usually nicer to keep them or reset to first.
        // Let's leave them for convenience or reset? Let's leave them.
    },

    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.render();
    },

    getSortedFilteredData() {
        let filtered = this.data;

        // 1. Search Query
        if (this.searchQuery) {
            filtered = filtered.filter(item => {
                return Object.values(item).some(val =>
                    String(val).toLowerCase().includes(this.searchQuery)
                );
            });
        }

        // 2. Filters
        if (this.filterType) {
            filtered = filtered.filter(item => item.type === this.filterType);
        }
        if (this.filterInstructor) {
            filtered = filtered.filter(item => item.instructor === this.filterInstructor);
        }
        if (this.filterCohort) {
            filtered = filtered.filter(item => item.cohort === this.filterCohort);
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
        const tbody = this.container.querySelector('#lectureTableBody');
        const countBadge = this.container.querySelector('#countBadge');

        // Populate Selects (Input Form)
        this.populateSelect('inp_type', this.lectureTypes);
        this.populateSelect('inp_instructor', this.instructors);
        this.populateSelect('inp_cohort', this.cohorts);

        // Populate Selects (Filters) - preserving selection
        this.populateSelect('filter_type', this.lectureTypes, true, this.filterType);
        this.populateSelect('filter_instructor', this.instructors, true, this.filterInstructor);
        this.populateSelect('filter_cohort', this.cohorts, true, this.filterCohort);

        if (!tbody) return;

        const displayData = this.getSortedFilteredData();
        if (countBadge) countBadge.textContent = `(${displayData.length})`;

        tbody.innerHTML = displayData.map(item => {
            const isEditing = this.isGlobalEditMode;

            if (isEditing) {
                return `
                    <tr class="editing-row" data-id="${item.id}">
                        <td><input type="date" value="${item.date}" data-field="date"></td>
                        <td><select data-field="type">${this.getOptions(this.lectureTypes, item.type)}</select></td>
                        <td><select data-field="instructor">${this.getOptions(this.instructors, item.instructor)}</select></td>
                        <td><select data-field="cohort">${this.getOptions(this.cohorts, item.cohort)}</select></td>
                        <td><input type="text" value="${item.episode}" data-field="episode"></td>
                        <td><input type="text" value="${item.yt}" data-field="yt"></td>
                        <td><input type="text" value="${item.release}" data-field="release"></td>
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
                        <td><span class="badge" style="background-color:${this.getColorForType(item.type || '')}; padding:4px 8px; border-radius:12px; font-size:0.8rem; color:#fff">${item.type || '-'}</span></td>
                        <td><span class="badge" style="background-color:${this.getInstructorColor(item.instructor || '')}; padding:4px 8px; border-radius:4px; font-size:0.8rem; color:#fff">${item.instructor || '-'}</span></td>
                        <td>${item.cohort || '-'}</td>
                        <td>${item.episode}</td>
                        <td class="link-cell">${this.renderLink(item.yt)}</td>
                        <td class="link-cell">${this.renderLink(item.release)}</td>
                        <td>${item.note || ''}</td>
                        <td class="actions-cell">
                            <button class="icon-btn" title="수정" onclick="app.activeModule.toggleRowEdit(${item.id})"><i class="fa-solid fa-pen"></i></button>
                            <button class="icon-btn" title="삭제" onclick="app.activeModule.deleteItem(${item.id})"><i class="fa-solid fa-trash"></i></button>
                        </td>
                    </tr>
                `;
            }
        }).join('');

        // Re-attach listeners for edit mode
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

        // Render sort icons
        this.container.querySelectorAll('th[data-sort]').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            const icon = th.querySelector('.sort-icon');
            if (th.dataset.sort === this.sortCol) {
                th.classList.add(this.sortAsc ? 'sort-asc' : 'sort-desc');
                icon.style.opacity = '1';
            } else {
                icon.style.opacity = '0.2';
            }
        });
    },

    populateSelect(id, options, includeAll = false, selectedVal = null) {
        const select = this.container.querySelector(`#${id}`);
        if (select) {
            const currentVal = select.value;
            let html = '';
            if (includeAll) {
                html += `<option value="">전체 (All)</option>`;
            }
            html += options.map(t => `<option value="${t}">${t}</option>`).join('');
            select.innerHTML = html;

            if (selectedVal !== null) {
                select.value = selectedVal;
            } else if (currentVal && (options.includes(currentVal) || (includeAll && currentVal === ''))) {
                select.value = currentVal;
            } else if (!includeAll && options.length > 0) {
                select.value = options[0];
            }
        }
    },

    getOptions(list, currentVal) {
        return list.map(t => `<option value="${t}" ${t === currentVal ? 'selected' : ''}>${t}</option>`).join('');
    },

    renderLink(url) {
        if (!url) return '-';
        return `
            <a href="${url}" target="_blank" title="${url}"><i class="fa-brands fa-youtube"></i> 열기</a>
            <button class="icon-btn" onclick="app.activeModule.copyToClipboard('${url}')" style="font-size:0.8em; margin-left:4px;"><i class="fa-regular fa-copy"></i></button>
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

        // Update button text
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
            this.saveData(); // Auto save on change in global edit mode
        }
    },

    deleteItem(id) {
        if (confirm('정말 삭제하시겠습니까?')) {
            this.data = this.data.filter(i => i.id !== id);
            this.saveData();
        }
    }
};
