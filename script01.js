// Claude v1-02

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
 
let alpha3ToAlpha2 = {};
// Для списка гостей ***
let countryDict = {}; // Будет хранить { "DEU": { alpha2: "DE", de: "Deutschland" } }
 
function flagFromAlpha2(a2) {
    return String.fromCodePoint(...[...a2.toUpperCase()].map(c => c.charCodeAt(0) + 127397));
}
 
async function init() {
    try {
        const response = await fetch('countries.json');
        const countries = await response.json();
        countries.forEach(c => {
            alpha3ToAlpha2[c.alpha3] = c.alpha2;
            countryDict[c.alpha3] = {
                alpha2: c.alpha2,
                nameDe: c.de
            };
 
        });
        startFirebase();
    } catch (e) { console.error("Fehler beim Herunterladen der Länder:", e); }
}
 
 
/*
async function init() {
    try {
        const response = await fetch('countries.json');
        const countries = await response.json();
        // Заполняем словарь всей нужной информацией
        countries.forEach(c => {
            countryDict[c.alpha3] = {
                alpha2: c.alpha2,
                nameDe: c.de
            };
        });
        startFirebase();
    } catch (e) { console.error("Fehler...", e); }
}*/
// *** Для списка гостей
 
// =====================
// 🎬 ОЧЕРЕДЬ АНИМАЦИЙ ПРИЛЁТА ФЛАГОВ
// =====================
// Гарантирует: новая анимация (Herzlich Willkommen + большой флаг)
// стартует только после того, как флаг предыдущего гостя
// ПОЛНОСТЬЮ долетел и приземлился на карте.
 
let animationQueue = [];       // ждущие своей очереди гости (объекты { id, country, district })
let isAnimating = false;       // сейчас идёт анимация появления/полёта
 
// ID гостей, которых мы уже когда-либо видели (чтобы не анимировать их повторно)
let knownGuestIds = new Set();
// ID гостей, чей флаг уже приземлился (можно рисовать как обычный статичный флаг)
let landedGuestIds = new Set();
// При самой первой загрузке страницы никого не анимируем — просто отображаем как есть
let isFirstLoad = true;
 
// Последний снэпшот гостей — нужен renderInitialDistricts() для первичной отрисовки карты
let guests_cache = [];
 
function enqueueGuest(guest) {
    animationQueue.push(guest);
    if (!isAnimating) {
        processQueue();
    }
}
 
function processQueue() {
    if (animationQueue.length === 0) {
        isAnimating = false;
        return;
    }
    isAnimating = true;
    const guest = animationQueue.shift();
    animateGuest(guest);
}
 
function animateGuest(guest) {
    const districtEl = document.getElementById(guest.district);
    const alpha2 = alpha3ToAlpha2[guest.country];
 
    // Некорректные/неизвестные данные — рисовать нечего, не блокируем очередь
    if (!districtEl || !alpha2) {
        landedGuestIds.add(guest.id);
        processQueue();
        return;
    }
 
    let wStep = 0;
    const countryInfo = countryDict[guest.country];
    const countryNameDe = countryInfo ? countryInfo.nameDe : "Unbekannt";
    console.log(countryNameDe);
 
    // Создаем "пустышку" (placeholder), которая занимает место в верстке
    const placeholder = document.createElement("span");
    placeholder.className = "placeholder";
    placeholder.textContent = flagFromAlpha2(alpha2);
    districtEl.appendChild(placeholder);
 
    // Тут позже мы запустим функцию полета к этой "пустышке"
    const rect = placeholder.getBoundingClientRect();
    const flying = document.createElement("div");
    flying.textContent = flagFromAlpha2(alpha2);
 
    const countryText = document.createElement("div");
    countryText.className = "wCountry";
    countryText.textContent = countryNameDe;
 
    flying.className = "test-flag";
 
    const frameEl = document.getElementById("frame");
    frameEl.appendChild(countryText);
    frameEl.appendChild(flying);
 
    const rect2 = flying.getBoundingClientRect();
    flying.style.position = "fixed";
    flying.style.left = (rect2.left + window.scrollX) + "px";
    flying.style.top = (rect2.top + window.scrollY) + "px";
 
    frameEl.style.visibility = "visible";
 
    wStep = 0;
    console.log("Step 0");
    console.log(wStep);
 
    // Фаза "показ надписи + большого флага" (2.5с) → старт полёта
    setTimeout(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                frameEl.style.visibility = "hidden";
 
                // Финальная точка: координаты placeholder + прокрутка
                flying.style.left = (rect.left + window.scrollX) + "px";
                flying.style.top = (rect.top + window.scrollY) + "px";
 
                // ВАЖНО: Масштаб и размер шрифта должны совпадать с тем,
                // что у флагов в районе (у вас 20px)
                flying.style.fontSize = "18px";
 
                flying.style.transition = "all 2s cubic-bezier(0.2, 0.8, 0.2, 1)"; // Время полета
                wStep = 1;
                console.log("Step 1");
                console.log(wStep);
 
                // ⛔ Следующий из очереди НЕ запускается здесь —
                // ждём полного завершения полёта (см. ниже, шаг "приземление")
            });
        });
    }, 2500);
 
    // Фаза "приземление" — полёт завершён, флаг встал на своё место в районе
    setTimeout(() => {
        if (flying) flying.remove();
        if (countryText) countryText.remove();
        placeholder.style.opacity = "1"; // Флаг становится видимым точно там, где был летун
        wStep = 2;
        console.log("Step 2");
        console.log(wStep);
 
        landedGuestIds.add(guest.id);
 
        // ✅ Полёт полностью завершён — можно показывать следующего гостя из очереди
        processQueue();
    }, 4400);
}
 
// Рисует флаги внутри районов карты ОДИН РАЗ — только при самой первой
// загрузке страницы, чтобы отобразить уже существующих (ранее сохранённых)
// гостей без анимации. После этого districts больше НЕ очищаются:
// каждый новый гость добавляет себе постоянный placeholder сам (в animateGuest),
// и он должен навсегда остаться в DOM — иначе долетевший флаг пропадает
// и появляется только после перезагрузки страницы.
function renderInitialDistricts() {
    document.querySelectorAll(".district").forEach(d => {
        d.innerHTML = "";
    });
 
    guests_cache.forEach(g => {
        if (!landedGuestIds.has(g.id)) return;
 
        const districtEl = document.getElementById(g.district);
        if (!districtEl) return;
 
        const alpha2 = alpha3ToAlpha2[g.country];
        if (!alpha2) return;
 
        const span = document.createElement("span");
        span.className = "flag";
        span.textContent = flagFromAlpha2(alpha2);
        districtEl.appendChild(span);
    });
}
 
function startFirebase() {
    const firebaseConfig = {
        apiKey: "AIzaSyB2TQLu_O5U-Jjxj1ArV4Cn79mtjp9cI9k",
        authDomain: "vielfaltfestv2.firebaseapp.com",
        projectId: "vielfaltfestv2",
        storageBucket: "vielfaltfestv2.firebasestorage.app",
        messagingSenderId: "657334897151",
        appId: "1:657334897151:web:f1651bca7dc22f250d3fca"
    };
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
 
    onSnapshot(query(collection(db, "guests"), orderBy("createdAt", "asc")), (snapshot) => {
        const guests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        guests_cache = guests;
        document.getElementById("count").innerText = guests.length;
 
        if (isFirstLoad) {
            // При самой первой загрузке страницы просто показываем всех как есть,
            // без анимации "прилёта" (иначе при каждом открытии/обновлении экрана
            // все гости заново пролетали бы по одному)
            guests.forEach(g => {
                knownGuestIds.add(g.id);
                landedGuestIds.add(g.id);
            });
            isFirstLoad = false;
            // Рисуем карту один-единственный раз — для уже существующих гостей
            renderInitialDistricts();
        } else {
            // Находим гостей, которых мы ещё не видели — это и есть "новые".
            // Определяем по ID документа, а не по длине массива:
            // так корректно обрабатывается даже одновременная регистрация
            // нескольких гостей в одном снэпшоте — никто не потеряется и не наложится.
            const newGuests = guests.filter(g => !knownGuestIds.has(g.id));
            newGuests.forEach(g => {
                knownGuestIds.add(g.id);
                enqueueGuest(g); // ставим в очередь вместо немедленной анимации
            });
            // Карту больше НЕ перерисовываем целиком — новые гости
            // сами добавляют себе постоянный placeholder в animateGuest(),
            // а уже показанные флаги трогать не нужно.
        }
 
        // Для списка гостей ***
        // 1. Считаем количество гостей из каждой страны
        const counts = {};
        guests.forEach(g => {
            counts[g.country] = (counts[g.country] || 0) + 1;
        });
 
        // 2. Превращаем в массив для сортировки
        const sortedCountries = Object.keys(counts).map(code => ({
            code: code,
            count: counts[code],
            info: countryDict[code] || { alpha2: "XX", nameDe: "Unbekannt" }
        })).sort((a, b) => b.count - a.count);
 
        // 3. Рисуем список
        const listContainer = document.querySelector(".guest-list");
        listContainer.innerHTML = "";
 
        sortedCountries.forEach(item => {
            const row = document.createElement("div");
            row.className = "list-row";
            row.innerHTML = `
        <span class="flag-icon">${flagFromAlpha2(item.info.alpha2)}</span>
        <span class="country-name">${item.info.nameDe}</span>
        <span class="country-count">${item.count}</span>
`;
            listContainer.appendChild(row);
        }); // *** Для списка гостей
    });
}
 
init();
 