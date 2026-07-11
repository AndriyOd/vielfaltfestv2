
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

// Добавьте эту переменную ПЕРЕД функцией startFirebase, чтобы она сохранялась между вызовами
let previousGuestsCount = 0;

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
        const guests = snapshot.docs.map(doc => doc.data());
        document.getElementById("count").innerText = guests.length;

        document.querySelectorAll(".district").forEach(d => {
            //const title = d.querySelector("h3");
            d.innerHTML = "";
            //d.appendChild(title);
        });

        // Проверяем, добавился ли новый гость
        const isNewGuestAdded = guests.length > previousGuestsCount && previousGuestsCount !== 0;

        guests.forEach((g, index) => {
            const districtEl = document.getElementById(g.district);
            if (!districtEl) return;

            const alpha2 = alpha3ToAlpha2[g.country];
            if (!alpha2) return;

            // ЕСЛИ это новый гость и мы хотим его анимировать
            if (isNewGuestAdded && index === guests.length - 1) {

                let wStep = 0;
                const countryInfo = countryDict[g.country];
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
                //flying.className = "flying-flag";
                flying.textContent = flagFromAlpha2(alpha2);

                const countryText = document.createElement("div");
                countryText.className = "wCountry";
                countryText.textContent = countryNameDe;

                // Стили, которые делают летуна идентичным финалу
                //flying.style.position = "fixed";
                //flying.style.zIndex = "2000";
                //flying.style.pointerEvents = "none";
                //flying.style.transition = "all 2s cubic-bezier(0.2, 0.8, 0.2, 1)"; // Время полета
                //flying.style.fontSize = "50px"; // Начальный размер

                // Начальная точка: центр экрана
                //flying.style.left = "50%";
                //flying.style.top = "50%";
                //flying.style.transform = "translate(-50%, -50%) scale(4)";

                flying.className = "test-flag";

                /*document.body.appendChild(flying);*/
                const frameEl = document.getElementById("frame");
                if (!districtEl) return;
                frameEl.appendChild(countryText);
                frameEl.appendChild(flying);


                const rect2 = flying.getBoundingClientRect();
                flying.style.position = "fixed";
                flying.style.left = (rect2.left + window.scrollX) + "px";
                flying.style.top = (rect2.top + window.scrollY) + "px";


                //const willkommen = document.getElementById("willkommen");
                //willkommen.className = "willkommen";

                frameEl.style.visibility = "visible";

                //willkommen.style.fontSize ="4em";
                //willkommen.style.transition = "all 2s cubic-bezier(0.2, 0.8, 0.2, 1)";

                //countryText.style.fontSize ="2.5em";
                //countryText.style.transition = "all 2s cubic-bezier(0.2, 0.8, 0.2, 1)";

                //flying.style.fontSize ="8em";
                //flying.style.transition = "all 2s cubic-bezier(0.2, 0.8, 0.2, 1)";

                //frameEl.style.transform = "scale(1.1)";
                //frameEl.style.transition = "all 2s cubic-bezier(0.2, 0.8, 0.2, 1)";

                //if (flying) flying.remove();
                /*placeholder.style.visibility = "visible"; // Флаг становится видимым точно там, где был летун*/
                //placeholder.style.opacity = "1"; // Флаг становится видимым точно там, где был летун
                //frameEl.style.visibility="hidden";
                wStep = 0;
                console.log("Step 0");
                console.log(wStep);

                setTimeout(() => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            /*
                            const rect2 = flying.getBoundingClientRect();
                            flying.style.position = "fixed";
                            flying.style.left = (rect2.left + window.scrollX) + "px";
                            flying.style.top = (rect2.top + window.scrollY) + "px";
                            */

                            frameEl.style.visibility = "hidden";

                            // Финальная точка: координаты placeholder + прокрутка
                            //flying.style.position = "fixed";
                            flying.style.left = (rect.left + window.scrollX) + "px";
                            flying.style.top = (rect.top + window.scrollY) + "px";

                            // ВАЖНО: Масштаб и размер шрифта должны совпадать с тем, 
                            // что у флагов в районе (у вас 20px)
                            //flying.style.transform = "translate(0, 0) scale(1)";
                            flying.style.fontSize = "18px";

                            flying.style.transition = "all 2s cubic-bezier(0.2, 0.8, 0.2, 1)"; // Время полета
                            wStep = 1;
                            console.log("Step 1");
                            console.log(wStep);
                        });
                    });
                }, 2500);

                setTimeout(() => {
                    if (flying) flying.remove();
                    if (countryText) countryText.remove();
                    /*placeholder.style.visibility = "visible"; // Флаг становится видимым точно там, где был летун*/
                    placeholder.style.opacity = "1"; // Флаг становится видимым точно там, где был летун
                    //frameEl.style.visibility = "hidden";
                    wStep = 2;
                    console.log("Step 2");
                    console.log(wStep);
                }, 4400);

            } else {
                // Обычный вывод
                const span = document.createElement("span");
                span.className = "flag";
                span.textContent = flagFromAlpha2(alpha2);
                districtEl.appendChild(span);
            }
        });
        // Обновляем счетчик для следующего раза
        previousGuestsCount = guests.length;


        // Для списка гостей ***
        // ... внутри onSnapshot ...

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
        listContainer.innerHTML = "<h3>Gäste nach Land</h3>"; // Заголовок

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