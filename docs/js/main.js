const pokemonList = document.getElementById('pokemonList');
const searchInput = document.getElementById('pokemonSearch');
const themeToggle = document.getElementById('theme-toggle');
const sentinel = document.getElementById('sentinel');
const modal = document.getElementById('pokemonModal');
const modalDetails = document.getElementById('modalDetails');
const closeModal = document.querySelector('.close-modal');
const body = document.body;

const limit = 12;
let offset = 0;
let searchTimeout;
let allPokemonCache = [];

// Gerenciamento de Tema
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.innerText = 'light_mode';
}

// Converte Pokémon completo para HTML
function converterParaLista(pokemon) {
    return `
        <li class="pokemon ${pokemon.type}" onclick="abrirModal('${pokemon.name}')"> 
            <span class="number">#${pokemon.number}</span>
            <span class="name">${pokemon.name}</span>
            <div class="detail">
                <ol class="types">
                    ${pokemon.types.map((type) => `<li class="type ${type}">${type}</li>`).join('')}
                </ol>
                <img src="${pokemon.photo}" alt="${pokemon.name}">
            </div>
        </li>`;
}

// Carrega mais Pokémon via scroll
function carregarPokemonItens(offset, limit) {
    if (searchInput.value.length > 0) return;
    pokeApi.getPokemons(offset, limit).then((pokemons = []) => {
        const newHtml = pokemons.map(converterParaLista).join('');
        pokemonList.insertAdjacentHTML('beforeend', newHtml);
    });
}

// Reseta lista quando remove pesquisa
function resetarLista() {
    offset = 0;
    pokemonList.innerHTML = "";
    sentinel.style.display = 'block';

    observer.unobserve(sentinel);

    carregarPokemonItens(offset, limit);

    observer.observe(sentinel);
}

// Busca global 
function efetuarBuscaGlobal(searchTerm) {
    // Filtra nomes no cache
    const filtered = allPokemonCache.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.url.split('/')[6].includes(searchTerm)
    );

    // Se nada foi encontrado
    if (filtered.length === 0) {
        pokemonList.innerHTML = `
            <p style="text-align:center; color: var(--text-body); font-style: italic;">
                Nenhum Pokémon encontrado.
            </p>
        `;
        sentinel.style.display = 'none';
        return;
    }

    Promise.all(filtered.map(p => pokeApi.getPokemonDetailByName(p.name)))
        .then(pokemonsDetalhados => {
            const html = pokemonsDetalhados
                .filter(p => !!p.photo) 
                .map(converterParaLista)
                .join("");

            pokemonList.innerHTML = html;

            // Enquanto estiver em estado de busca, desliga o scroll
            sentinel.style.display = 'none';
        })
        .catch(error => {
            console.error("Erro ao tentar buscar detalhes dos Pokémons:", error);
        });
}

// Modal do Pokémon
async function abrirModal(pokemonName) {
    try {
        const pokemon = await pokeApi.getPokemonDetailByName(pokemonName);

        modalDetails.innerHTML = `
            <div class="modal-header ${pokemon.type}" style="border-radius: 1rem; padding: 1.5rem; color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="text-transform: capitalize; margin: 0;">${pokemon.name}</h2>
                    <span>#${pokemon.number}</span>
                </div>
                <img src="${pokemon.photo}" alt="${pokemon.name}" style="width: 160px; display: block; margin: 10px auto;">
            </div>

            <div class="modal-body" style="padding: 1.5rem; color: var(--text-title);">
                <div style="display: flex; justify-content: space-around; margin-bottom: 1.5rem; text-align: center;">
                    <div><strong>${pokemon.weight}kg</strong><br><small style="color: var(--text-body)">Peso</small></div>
                    <div><strong>${pokemon.height}m</strong><br><small style="color: var(--text-body)">Altura</small></div>
                </div>

                <h3>Status Base</h3>
                <div style="display: grid; gap: 8px; margin-top: 10px;">
                    ${renderStat('HP', pokemon.hp, '#ff5959')}
                    ${renderStat('ATK', pokemon.attack, '#f5ac78')}
                    ${renderStat('DEF', pokemon.defense, '#fae078')}
                    ${renderStat('SPD', pokemon.speed, '#fa92b2')}
                </div>
            </div>`;

        modal.classList.add('show');
        modal.style.display = 'flex';
        body.classList.add('modal-open');
    } catch (error) {
        console.error("Erro ao abrir modal:", error);
    }
}

function renderStat(label, value, color) {
    const barWidth = Math.min(value, 100);
    return `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="width: 35px; font-weight: bold; font-size: 0.75rem;">${label}</span>
            <span style="width: 30px; font-size: 0.85rem;">${value}</span>
            <div style="flex-grow: 1; background: rgba(0,0,0,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                <div style="width: ${barWidth}%; background: ${color}; height: 100%;"></div>
            </div>
        </div>`;
}

// Fechar modal
function fecharModal() {
    modal.classList.remove('show');
    modal.style.display = 'none';
    body.classList.remove('modal-open');
}

closeModal.onclick = fecharModal;
window.onclick = (event) => {
    if (event.target == modal) fecharModal();
};
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) fecharModal();
});

// Inicialização
carregarPokemonItens(offset, limit);

// Preenche cache de Pokémon (nome + URL)
pokeApi.getAllPokemonNames().then(results => {
    allPokemonCache = results;
});

// Listener de Busca com debounce
searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    clearTimeout(searchTimeout);

    if (searchTerm === "") {
        resetarLista();
        return;
    }

    searchTimeout = setTimeout(() => {
        efetuarBuscaGlobal(searchTerm);
    }, 300);
});

// IntersectionObserver para infinite scroll
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && searchInput.value.length === 0) {
        offset += limit;
        carregarPokemonItens(offset, limit);
    }
}, { rootMargin: '300px' });

observer.observe(sentinel);

// Tema dark/light
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLightMode = document.body.classList.contains('light-mode');
    themeToggle.innerText = isLightMode ? 'light_mode' : 'dark_mode';
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
});
