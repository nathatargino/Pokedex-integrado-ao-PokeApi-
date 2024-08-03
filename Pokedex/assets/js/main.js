const pokemonList = document.getElementById('pokemonList')
const carregarMais = document.getElementById('carregarMais')
const limit = 12
let offset = 0;



function carregarPokemonItens(offset, limit) {
    function converterParaLista(pokemon) {
        return `
        <li class="pokemon ${pokemon.type}">
                    <span class="number">#${pokemon.number}</span>
                    <span class="name">${pokemon.name}</span>
    
                    <div class="detail">
                        <ol class="types">
                            ${pokemon.types.map((type) => `<li class="type ${type}">${type}</li>`).join('')}
                        </ol>
    
                        <img src="${pokemon.photo}"  
                        alt="${pokemon.name}">
                    </div>
                </li>
        `
    }
    
    
    pokeApi.getPokemons(offset, limit).then((pokemons = []) => {
        const newHtml = pokemons.map(converterParaLista).join('')
        pokemonList.insertAdjacentHTML('beforeend', newHtml);
})
    
}

carregarPokemonItens(offset, limit)

carregarMais.addEventListener('click', () => {
    offset += limit
    carregarPokemonItens(offset, limit)
})
