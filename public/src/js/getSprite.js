function getData(){
    var url = "https://pokeapi.co/api/v2/pokemon/";
    var input = document.getElementById("id");
    var id = input.value;
    var request = url+String(id);
    fetch(request)
    .then(function(data){
        return data.json();
    })
    .then(function(json){
        var decoded = json;
        fetch(decoded.forms[0].url)
        .then(function(decoded_pics){
            return decoded_pics.json();
        })
        .then(function(decoded_pics_json){
            var front_pic = decoded_pics_json.sprites.front_default;
            var element = document.getElementById("poke");
            element.src = front_pic;
        })
        
    })
}