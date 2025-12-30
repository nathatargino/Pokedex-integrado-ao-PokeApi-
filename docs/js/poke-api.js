const pokeApi = {}



function convertPokeApiDetailToPokemon(pokeDetail) {

    const pokemon = new Pokemon()

    pokemon.number = pokeDetail.id

    pokemon.name = pokeDetail.name

   

    const types = pokeDetail.types.map((typeSlot) => typeSlot.type.name)

    const [type] = types



    pokemon.types = types

    pokemon.type = type

    pokemon.photo = pokeDetail.sprites.other.dream_world.front_default



    // Extração de dados detalhados para o Modal

    pokemon.hp = pokeDetail.stats[0].base_stat;

    pokemon.attack = pokeDetail.stats[1].base_stat;

    pokemon.defense = pokeDetail.stats[2].base_stat;

    pokemon.speed = pokeDetail.stats[5].base_stat;

    pokemon.weight = pokeDetail.weight / 10; // Convertido para kg

    pokemon.height = pokeDetail.height / 10; // Convertido para metros

    pokemon.abilities = pokeDetail.abilities.map((slot) => slot.ability.name);



    return pokemon

}



pokeApi.getPokemonDetail = (pokemon) => {

    return fetch(pokemon.url)

        .then((response) => response.json())

        .then(convertPokeApiDetailToPokemon)

}



pokeApi.getPokemons = (offset = 0, limit = 12) => {

    const url = `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`

    return fetch(url)

        .then((response) => response.json())

        .then((jsonBody) => jsonBody.results)

        .then((pokemons) => pokemons.map(pokeApi.getPokemonDetail))

        .then((detailRequests) => Promise.all(detailRequests))

}



pokeApi.getPokemonDetailByName = (name) => {

    const url = `https://pokeapi.co/api/v2/pokemon/${name}`;

    return fetch(url)

        .then((response) => {

            if (!response.ok) throw new Error('Pokemon não encontrado');

            return response.json();

        })

        .then(convertPokeApiDetailToPokemon);

};



pokeApi.getAllPokemonNames = () => {

    const url = `https://pokeapi.co/api/v2/pokemon?limit=2000&offset=0`;

    return fetch(url)

        .then((response) => response.json())

        .then((jsonBody) => jsonBody.results);

};