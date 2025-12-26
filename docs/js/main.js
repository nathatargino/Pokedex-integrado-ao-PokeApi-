const pokemonList = document.getElementById('pokemonList');
const searchInput = document.getElementById('pokemonSearch');
const themeToggle = document.getElementById('theme-toggle');
const sentinel = document.getElementById('sentinel');

const limit = 12;
let offset = 0;
let searchTimeout;
let allPokemonCache = [];

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeToggle.innerText = 'light_mode';
}

function converterParaLista(pokemon) {
    return `
        <li class="pokemon ${pokemon.type}">
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

function carregarPokemonItens(offset, limit) {
    if (searchInput.value.length > 0) return;
    pokeApi.getPokemons(offset, limit).then((pokemons = []) => {
        const newHtml = pokemons.map(converterParaLista).join('');
        pokemonList.insertAdjacentHTML('beforeend', newHtml);
    });
}

function resetarLista() {
    offset = 0;
    pokemonList.innerHTML = "";
    sentinel.style.display = 'block';
    carregarPokemonItens(offset, limit);
}

async function efetuarBuscaGlobal(termo) {
    try {
        const pokemon = await pokeApi.getPokemonDetailByName(termo);
        if (pokemon) {
            pokemonList.innerHTML = converterParaLista(pokemon);
            sentinel.style.display = 'none';
        }
    } catch (error) {
        const temPokemonVisivel = Array.from(document.querySelectorAll('.pokemon'))
            .some(p => p.style.display !== 'none');

        if (!temPokemonVisivel) {
            pokemonList.innerHTML = `
                <div class="search-error" style="color: var(--text-body); text-align: center; width: 100%; grid-column: 1/-1; padding: 2rem;">
                    <span class="material-icons" style="font-size: 3rem; opacity: 0.5;">sentiment_very_dissatisfied</span>
                    <p>Pokémon "${termo}" não encontrado.</p>
                </div>`;
        }
    }
}

carregarPokemonItens(offset, limit);

pokeApi.getAllPokemonNames().then(results => {
    allPokemonCache = results;
});

searchInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    clearTimeout(searchTimeout);

    if (searchTerm === "") {
        resetarLista();
        return;
    }

    const pokemonItems = document.querySelectorAll('.pokemon');
    let encontrouLocal = false;

    pokemonItems.forEach(pokemon => {
        const name = pokemon.querySelector('.name').innerText.toLowerCase();
        const number = pokemon.querySelector('.number').innerText.toLowerCase();
        const types = Array.from(pokemon.querySelectorAll('.type')).map(t => t.innerText.toLowerCase()).join(' ');

        const matches = name.includes(searchTerm) || number.includes(searchTerm) || types.includes(searchTerm);
        
        if (matches) {
            pokemon.style.display = "flex";
            encontrouLocal = true;
        } else {
            pokemon.style.display = "none";
        }
    });

    if (!encontrouLocal && searchTerm.length >= 2) {
        const match = allPokemonCache.find(p => p.name.includes(searchTerm));
        
        if (match) {
            efetuarBuscaGlobal(match.name);
        } else {
            searchTimeout = setTimeout(() => {
                efetuarBuscaGlobal(searchTerm);
            }, 500);
        }
    } else if (encontrouLocal) {
        const erroMsg = document.querySelector('.search-error');
        if (erroMsg) erroMsg.remove();
        sentinel.style.display = 'none';
    }
});

const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && searchInput.value.length === 0) {
        offset += limit;
        carregarPokemonItens(offset, limit);
    }
}, { rootMargin: '300px' });

observer.observe(sentinel);

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLightMode = document.body.classList.contains('light-mode');
    
    themeToggle.innerText = isLightMode ? 'light_mode' : 'dark_mode';
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
});

// Botão para o topo 
const backToTopButton = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
        backToTopButton.classList.add('show');
    } else {
        backToTopButton.classList.remove('show');
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});