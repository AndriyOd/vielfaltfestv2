
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

let alpha3ToAlpha2 = {};

function flagFromAlpha2(a2) {
    return String.fromCodePoint(...[...a2.toUpperCase()].map(c => c.charCodeAt(0) + 127397));
}

async function init() {
    try {
        const response = await fetch('countries.json');
        const countries = await response.json();
        countries.forEach(c => alpha3ToAlpha2[c.alpha3] = c.alpha2);
        startFirebase();
    } catch (e) { console.error("Fehler beim Herunterladen der Länder:", e); }
}

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
                // Создаем "пустышку" (placeholder), которая занимает место в верстке
                const placeholder = document.createElement("span");
                placeholder.className = "placeholder";
                placeholder.textContent = flagFromAlpha2(alpha2);
                districtEl.appendChild(placeholder);

                // Тут позже мы запустим функцию полета к этой "пустышке"
                const rect = placeholder.getBoundingClientRect();
                const flying = document.createElement("div");
                flying.className = "flying-flag";
                flying.textContent = flagFromAlpha2(alpha2);

                // Стили, которые делают летуна идентичным финалу
                flying.style.position = "fixed";
                flying.style.zIndex = "2000";
                flying.style.pointerEvents = "none";
                flying.style.transition = "all 2s cubic-bezier(0.2, 0.8, 0.2, 1)"; // Время полета
                flying.style.fontSize = "50px"; // Начальный размер

                // Начальная точка: центр экрана
                flying.style.left = "50%";
                flying.style.top = "50%";
                flying.style.transform = "translate(-50%, -50%) scale(4)";

                document.body.appendChild(flying);

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        // Финальная точка: координаты placeholder + прокрутка
                        flying.style.left = (rect.left + window.scrollX) + "px";
                        flying.style.top = (rect.top + window.scrollY) + "px";

                        // ВАЖНО: Масштаб и размер шрифта должны совпадать с тем, 
                        // что у флагов в районе (у вас 20px)
                        flying.style.transform = "translate(0, 0) scale(1)";
                        flying.style.fontSize = "20px";
                    });
                });

                setTimeout(() => {
                    if (flying) flying.remove();
                    placeholder.style.visibility = "visible"; // Флаг становится видимым точно там, где был летун
                }, 2100);
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
    });
}

init();
