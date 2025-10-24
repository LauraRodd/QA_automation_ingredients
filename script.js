// ============================================
// Ingredient QA Bookmarklet - v3.1 FINAL
// Date: October 24, 2025
// Features: Google Sheets auto-fetch, cache-busting, alphabetical locales (INT first)
// ============================================
(function() {
    // Google Sheets Published URL
    const EXCEL_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1nadtCyxsEZMN6BjuDCL1AhvzDhOt0GLNvAIbKbdfjPwb7ScAgj1gal9abvojjA/pub?output=xlsx';
    
    // Brand Colors
    const COLORS = {
        primary: '#283545',
        accent: '#A82342',
        success: '#10B981',
        error: '#EF4444',
        light: '#f9fafb',
        border: '#ddd'
    };
    
    // Locale Names (alphabetical order, INT always first)
    const LOCALE_NAMES = {
        int: 'International',
        at: 'Austria',
        bg: 'Bulgaria',
        es: 'Spain',
        fr: 'France',
        hu: 'Hungary',
        pl: 'Poland',
        ro: 'Romania',
        rs: 'Serbia'
    };
    
    // Show loading indicator
    function showLoading() {
        const loading = document.createElement('div');
        loading.id = 'qaLoading';
        loading.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid ${COLORS.primary};
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            z-index: 999999;
            text-align: center;
            font-family: Inter, sans-serif;
        `;
        loading.innerHTML = `
            <h2 style="margin:0 0 20px 0;color:${COLORS.primary};">🧪 Loading QA Tool</h2>
            <p style="margin:0;color:#666;">Fetching latest data from Google Sheets...</p>
            <div style="margin-top:20px;width:200px;height:4px;background:#f0f0f0;border-radius:2px;overflow:hidden;">
                <div style="width:30%;height:100%;background:${COLORS.accent};border-radius:2px;animation:loading 1.5s infinite;"></div>
            </div>
            <style>
                @keyframes loading {
                    0%, 100% { margin-left: 0; }
                    50% { margin-left: 70%; }
                }
            </style>
        `;
        document.body.appendChild(loading);
        return loading;
    }
    
    // Error handling
    function showError(title, message, details = null) {
        const existingError = document.getElementById('ingredientErrorPanel');
        if (existingError) existingError.remove();
        const errorPanel = document.createElement('div');
        errorPanel.id = 'ingredientErrorPanel';
        errorPanel.style.cssText = `
            position: fixed;
            top: 30px;
            right: 30px;
            width: 400px;
            background: #fee2e2;
            border: 2px solid #dc2626;
            border-radius: 12px;
            padding: 20px 24px;
            box-shadow: 0 12px 42px rgba(220,38,38,0.12);
            font-family: Inter, sans-serif;
            color: #991b1b;
            z-index: 99999;
        `;
        const closeBtn = document.createElement('button');
        closeBtn.innerText = '✕';
        closeBtn.style.cssText = 'position:absolute;top:8px;right:8px;background:none;border:none;color:#dc2626;font-size:22px;font-weight:bold;cursor:pointer;';
        closeBtn.onclick = () => errorPanel.remove();
        errorPanel.appendChild(closeBtn);
        errorPanel.innerHTML += `<h2 style="margin:0 0 10px 0;">${title}</h2>
            <div style="margin-bottom:8px;">${message}</div>
            ${details ? `<pre style="background:#fff0f6;padding:6px;border-radius:6px;font-size:12px;max-height:200px;overflow:auto;">${details}</pre>` : ''}`;
        document.body.appendChild(errorPanel);
        setTimeout(() => errorPanel.remove(), 15000);
    }
    
    // Load SheetJS library
    function loadSheetJS() {
        return new Promise((resolve, reject) => {
            if (window.XLSX) {
                resolve(window.XLSX);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
            script.onload = () => resolve(window.XLSX);
            script.onerror = () => reject(new Error('Failed to load Excel parser'));
            document.head.appendChild(script);
        });
    }
    
    // Fetch and parse Excel from Google Sheets with cache-busting
    async function fetchAndParseExcel() {
        try {
            const XLSX = await loadSheetJS();
            
            // Add cache-busting timestamp to always get fresh data
            const cacheBuster = `&_=${Date.now()}`;
            const urlWithCacheBuster = EXCEL_URL + cacheBuster;
            
            const response = await fetch(urlWithCacheBuster, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const data = { universal: { allowedEnglish: [] } };
            const localeMapping = {
                'Universal': 'universal',
                'INT': 'int',
                'FR': 'fr',
                'RS': 'rs',
                'RO': 'ro',
                'HU': 'hu',
                'AT': 'at',
                'ES': 'es',
                'BG': 'bg',
                'PL': 'pl'
            };
            
            workbook.SheetNames.forEach(sheetName => {
                const locale = localeMapping[sheetName];
                if (!locale) return;
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                
                if (locale === 'universal') {
                    data.universal.allowedEnglish = jsonData
                        .map(row => row['Key Ingredients'])
                        .filter(val => val && String(val).trim());
                } else {
                    data[locale] = {
                        key: jsonData.map(row => row['Key Ingredients (Should be Linked)']).filter(val => val && String(val).trim()),
                        renamedOld: jsonData.map(row => row['Old Name']).filter(val => val && String(val).trim()),
                        removed: jsonData.map(row => row['Ingredients Removed']).filter(val => val && String(val).trim())
                    };
                }
            });
            return data;
        } catch (error) {
            throw new Error(`Failed to load from Google Sheets: ${error.message}`);
        }
    }
    
    // Normalization function
    function normalizeText(text) {
        if (!text) return "";
        return String(text).trim().toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/[+]/g, 'plus')
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, '');
    }
    
    // Merge with English from INT
    function mergeWithEnglish(localeArray, arrayType, ingredientsData) {
        const intArray = ingredientsData.int[arrayType] || [];
        return [...localeArray, ...intArray];
    }
    
    // Get linked ingredients from page
    function getLinkedIngredientsExact(container) {
        return Array.from(container.querySelectorAll('a')).map(link => ({
            normalized: normalizeText(link.innerText),
            original: link.innerText.trim(),
            element: link
        }));
    }
    
    // Create styled element helper
    function createStyledElement(tag, styles = {}) {
        const el = document.createElement(tag);
        Object.assign(el.style, styles);
        return el;
    }
    
    // Run QA tests for selected locale
    function runTests(localeKey, ingredientsData) {
        const locale = ingredientsData[localeKey];
        if (!locale) {
            alert("Error: Locale not found: " + localeKey);
            return;
        }
        
        const container = document.querySelector('.glossary-panels.cp-container');
        if (!container) {
            displayResults('<h2>Error: Container Not Found</h2>', false, localeKey, ingredientsData);
            return;
        }

        const linkedIngredients = getLinkedIngredientsExact(container);
        const linkedNormalizedSet = new Set(linkedIngredients.map(l => l.normalized));
        
        // Combine locale key ingredients with universal allowed English
        const allKeyIngredients = [...locale.key, ...ingredientsData.universal.allowedEnglish];
        const keyIngredientsMap = new Map(allKeyIngredients.map(k => [normalizeText(k), k]));
        
        // Merge with English from INT
        const allRenamedOld = mergeWithEnglish(locale.renamedOld, 'renamedOld', ingredientsData);
        const allRemoved = mergeWithEnglish(locale.removed, 'removed', ingredientsData);
        
        const oldNamesMap = new Map(allRenamedOld.map(o => [normalizeText(o), o]));
        const removedMap = new Map(allRemoved.map(r => [normalizeText(r), r]));

        let allRulesPassed = true;
        let ruleResults = {};
        const ignoredByRule6 = new Set();

        // RULE 1: Removed Ingredients Are Not Present
        ruleResults.rule1 = { name: '1. Removed Ingredients Are Not Present', failures: [], passed: true };
        removedMap.forEach((original, normalized) => {
            if (linkedNormalizedSet.has(normalized)) {
                ruleResults.rule1.failures.push(original);
                ruleResults.rule1.passed = false;
                allRulesPassed = false;
                ignoredByRule6.add(normalized);
            }
        });

        // RULE 2: Old/Renamed Names Are Not Present
        ruleResults.rule2 = { name: '2. Old/Renamed Names Are Not Present', failures: [], passed: true };
        oldNamesMap.forEach((original, normalized) => {
            if (linkedNormalizedSet.has(normalized)) {
                ruleResults.rule2.failures.push(original);
                ruleResults.rule2.passed = false;
                allRulesPassed = false;
                ignoredByRule6.add(normalized);
            }
        });

        // RULE 3: Only Key Ingredients Are Linked
        ruleResults.rule3 = { name: '3. Only Key Ingredients Are Linked', failures: [], passed: true };
        linkedIngredients.forEach(linked => {
            const normalizedName = linked.normalized;
            if (ignoredByRule6.has(normalizedName)) return;
            if (normalizedName && !keyIngredientsMap.has(normalizedName)) {
                ruleResults.rule3.failures.push(linked.original);
                ruleResults.rule3.passed = false;
                allRulesPassed = false;
            }
        });

        // RULE 4: All Key Ingredients Are Linked
        ruleResults.rule4 = { name: '4. All Key Ingredients Are Linked', failures: [], passed: true };
        locale.key.forEach(keyIngredient => {
            const normalized = normalizeText(keyIngredient);
            if (!linkedNormalizedSet.has(normalized)) {
                ruleResults.rule4.failures.push(keyIngredient);
                ruleResults.rule4.passed = false;
                allRulesPassed = false;
            }
        });

        displayResults(ruleResults, allRulesPassed, localeKey, ingredientsData);
    }
    
    // Build results HTML
    function buildResultsHTML(ruleResults, allPassed, localeKey) {
        let html = '';
        if (allPassed) {
            html += `<div style="text-align:center;padding:20px;background:${COLORS.success};color:white;border-radius:8px;margin-bottom:20px">
                <h2 style="margin:0;font-size:24px">🥳 Nice Work! No issues found</h2>
                <p style="margin:10px 0 0 0;font-size:14px">All ${Object.keys(ruleResults).length} rules passed for ${LOCALE_NAMES[localeKey] || localeKey.toUpperCase()}.</p>
            </div>`;
        } else {
            const totalFailures = Object.values(ruleResults).reduce((sum, rule) => sum + rule.failures.length, 0);
            html += `<div style="padding:15px;background:${COLORS.accent};color:white;border-radius:8px;margin-bottom:20px">
                <h2 style="margin:0;font-size:20px;color:white">⚠️ QA Summary: ${totalFailures} Issue${totalFailures !== 1 ? 's' : ''} Found</h2>
                <p style="margin:5px 0 0 0;font-size:14px;color:white">Locale: <strong>${LOCALE_NAMES[localeKey] || localeKey.toUpperCase()}</strong></p>
            </div>`;
        }
        
        Object.values(ruleResults).forEach((rule) => {
            const failureCount = rule.failures.length;
            const bgColor = rule.passed ? COLORS.success : COLORS.accent;
            const badgeBg = rule.passed ? COLORS.success : COLORS.error;
            
            html += `<div style="margin:20px 0;border-left:4px solid ${bgColor};padding-left:15px;background:${COLORS.light};border-radius:4px">
                <h3 style="margin:0 0 10px 0;color:${COLORS.primary};font-size:15px;display:flex;justify-content:space-between;align-items:center;padding-top:10px">
                    <span>${rule.name}</span>
                    <span style="background:${badgeBg};color:white;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700">
                        ${failureCount} ${failureCount === 1 ? 'failure' : 'failures'}
                    </span>
                </h3>`;
            
            if (rule.passed) {
                html += `<p style="margin:8px 0 10px 0;color:${COLORS.success};font-weight:600">✓ PASSED</p>`;
            } else {
                html += `<ul style="margin:8px 0 10px 0;padding-left:0;list-style:none;max-height:150px;overflow-y:auto">`;
                rule.failures.forEach(failure => {
                    html += `<li style="margin:4px 0;color:${COLORS.primary};border-bottom:1px dashed #eee;padding-bottom:4px">
                        <strong style="color:${COLORS.error}">${failure}</strong>
                    </li>`;
                });
                html += `</ul>`;
            }
            html += `</div>`;
        });
        return html;
    }
    
    // Display results panel
    function displayResults(ruleResults, allPassed, localeKey, ingredientsData) {
        const existingPanel = document.getElementById('ingredientTestPanel');
        if (existingPanel) existingPanel.remove();

        const panel = createStyledElement('div', {
            position: 'fixed', top: '10px', right: '10px', width: '400px',
            maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto',
            background: 'white', border: `2px solid ${COLORS.primary}`,
            borderRadius: '12px', padding: '20px', paddingTop: '60px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: '99999',
            fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: '1.5'
        });
        panel.id = 'ingredientTestPanel';
        
        const style = document.createElement('style');
        style.textContent = `
            #ingredientTestPanel::-webkit-scrollbar { width: 8px; }
            #ingredientTestPanel::-webkit-scrollbar-track { background: ${COLORS.light}; border-radius: 4px; }
            #ingredientTestPanel::-webkit-scrollbar-thumb { background: ${COLORS.accent}; border-radius: 4px; }
        `;
        document.head.appendChild(style);

        const buttonBar = createStyledElement('div', {
            position: 'absolute', top: '0', left: '0', right: '0',
            background: COLORS.light, borderBottom: `2px solid ${COLORS.border}`,
            borderRadius: '12px 12px 0 0', padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: '100001'
        });

        const rerunBtn = createStyledElement('button', {
            border: 'none', background: COLORS.primary, padding: '8px 16px',
            borderRadius: '6px', fontSize: '14px', cursor: 'pointer',
            color: 'white', fontWeight: '600', display: 'flex',
            alignItems: 'center', gap: '6px', transition: 'all 0.2s'
        });
        rerunBtn.innerHTML = '🔄 Rerun Test';
        
        // Rerun button - re-fetches data
        rerunBtn.onclick = async () => {
            panel.remove();
            const loading = showLoading();
            try {
                const freshData = await fetchAndParseExcel();
                loading.remove();
                showWelcomeModal(freshData);
            } catch (error) {
                loading.remove();
                showError('Failed to Reload', 'Could not fetch updated data.', error.message);
            }
        };
        
        rerunBtn.onmouseover = () => { rerunBtn.style.background = COLORS.accent; rerunBtn.style.transform = 'scale(1.05)'; };
        rerunBtn.onmouseout = () => { rerunBtn.style.background = COLORS.primary; rerunBtn.style.transform = 'scale(1)'; };

        const closeBtn = createStyledElement('button', {
            border: `2px solid ${COLORS.primary}`, background: 'white',
            width: '36px', height: '36px', borderRadius: '6px', fontSize: '20px',
            cursor: 'pointer', color: COLORS.primary, fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
        });
        closeBtn.innerHTML = '✕';
        closeBtn.onclick = () => panel.remove();
        closeBtn.onmouseover = () => { closeBtn.style.background = COLORS.error; closeBtn.style.color = 'white'; closeBtn.style.borderColor = COLORS.error; };
        closeBtn.onmouseout = () => { closeBtn.style.background = 'white'; closeBtn.style.color = COLORS.primary; closeBtn.style.borderColor = COLORS.primary; };

        buttonBar.appendChild(rerunBtn);
        buttonBar.appendChild(closeBtn);
        panel.appendChild(buttonBar);

        const contentDiv = createStyledElement('div', { marginTop: '5px', paddingRight: '10px' });
        contentDiv.innerHTML = buildResultsHTML(ruleResults, allPassed, localeKey);
        panel.appendChild(contentDiv);
        document.body.appendChild(panel);
    }
    
    // Show welcome modal with locale selection
    function showWelcomeModal(ingredientsData) {
        const existingModal = document.getElementById('localeSelector');
        if (existingModal) existingModal.remove();

        // Get available locales and sort: INT first, then alphabetical
        const available = Object.keys(ingredientsData)
            .filter(k => k !== 'universal')
            .filter(k => ingredientsData[k].key && ingredientsData[k].key.length > 0)
            .sort((a, b) => {
                if (a === 'int') return -1;
                if (b === 'int') return 1;
                return LOCALE_NAMES[a].localeCompare(LOCALE_NAMES[b]);
            });

        const modal = createStyledElement('div', {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            background: 'rgba(0, 0, 0, 0.75)', display: 'flex',
            justifyContent: 'center', alignItems: 'center',
            zIndex: '999999', fontFamily: 'Inter, sans-serif'
        });
        modal.id = 'localeSelector';
        
        const content = createStyledElement('div', {
            background: 'white', borderRadius: '12px', padding: '40px',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)',
            maxWidth: '450px', maxHeight: '80vh', overflowY: 'auto', width: '90%', textAlign: 'center'
        });
        
        content.innerHTML = `
            <h2 style="margin:0 0 10px 0;color:${COLORS.primary};font-size:28px">🧪 Ingredients QA Helper</h2>
            <p style="margin:0 0 30px 0;color:#666;font-size:16px">Welcome! Please select a locale to begin testing:</p>
            <div id="localeButtons" style="display:flex;flex-direction:column;gap:10px;margin-bottom:25px"></div>
            <div style="display:flex;justify-content:flex-end;gap:10px">
              <button id="cancelBtn" style="padding:12px 20px;border:2px solid ${COLORS.border};background:white;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;color:${COLORS.primary};transition:all 0.2s">Cancel</button>
            </div>
        `;
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        const buttonsContainer = content.querySelector('#localeButtons');
        const cancelButton = content.querySelector('#cancelBtn');
        
        available.forEach(loc => {
            const btn = createStyledElement('button', {
                padding: '14px', border: `2px solid ${COLORS.primary}`,
                background: COLORS.primary, color: 'white', borderRadius: '8px',
                fontSize: '16px', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            });
            const localeName = LOCALE_NAMES[loc] || loc.toUpperCase();
            btn.textContent = `${localeName}: ${loc.toUpperCase()}`;
            btn.onmouseover = () => { btn.style.background = COLORS.accent; btn.style.borderColor = COLORS.accent; };
            btn.onmouseout = () => { btn.style.background = COLORS.primary; btn.style.borderColor = COLORS.primary; };
            btn.onclick = () => { modal.remove(); setTimeout(() => runTests(loc, ingredientsData), 100); };
            buttonsContainer.appendChild(btn);
        });
        
        cancelButton.onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }
    
    // Initialize
    (async () => {
        if (!document.body) {
            showError("Page Not Ready", "Please wait for the page to fully load.");
            return;
        }
        
        const container = document.querySelector('.glossary-panels.cp-container');
        if (!container) {
            showError("Wrong Page", "Make sure you're on an ingredients database page (e.g., https://int.eucerin.com/our-research/ingredients)");
            return;
        }
        
        const loading = showLoading();
        
        try {
            const ingredientsData = await fetchAndParseExcel();
            loading.remove();
            showWelcomeModal(ingredientsData);
        } catch (error) {
            loading.remove();
            showError('Failed to Load Data', 'Could not fetch data from Google Sheets.', error.message);
            console.error('QA Tool Error:', error);
        }
    })();
})();
