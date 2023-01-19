var ground = document.getElementById("ground");
var ctx = ground.getContext("2d");

var counter = 0;
var lifetime = 300;
var number_of_chromosomes = 100;

var mutation_chance = 0.05;

var ground_height = 500;
var ground_width = 1000;
var chromosome_dimensions = 5;

var positions = ["down","left","right","up"];
var position_increment = 1.5;

var get_genes = () => {
    var genes = [];

    for(var i=0;i<lifetime;i++){
        genes.push(positions[(Math.random() * positions.length) | 0])
    }

    return genes;
}

var make_population = () => {
    var population = [];

    for(var i=0;i<number_of_chromosomes;i++){
        population.push(new chromosome());
    }

    return population;
}

var chromosome = function (){
    this.genes = get_genes();
    this.fitness = 0;
    this.x = ground_width / 2 - chromosome_dimensions;
    this.y = chromosome_dimensions*5;
    this.alive = true;
    this.color = "#"+Math.floor(Math.random()*16777215).toString(16);

    this.move = () => {
        if(this.y<=0 || this.y>=ground_height || this.x<=0 || this.x>=ground_width){
            this.alive = false;
        }

        if(!this.alive){
            return;
        }

        if(this.genes[counter]=="up"){
            this.y-=position_increment;
        }

        if(this.genes[counter]=="left"){
            this.x-=position_increment;
        }

        if(this.genes[counter]=="down"){
            this.y+=position_increment;
        }

        if(this.genes[counter]=="right"){
            this.x+=position_increment;
        }
    }

    this.draw = () => {
        ctx.fillRect(this.x, this.y, chromosome_dimensions, chromosome_dimensions);
    }

    this.fitness_function = () => {
        if(!this.alive){
            return 0;
        }

        //this.fitness = ground_height - (ground_height - this.y);
        this.fitness = this.y*2;
    }
}

var fitness_scaling = (population) => {
    var min = population[0].fitness;

    for(var i=0;i<population.length;i++){
        if(min>population[i].fitness){
            min = population[i].fitness;
        }
    }

    if(min<0){
        for(var i=0;i<population.length;i++){
            population[i].fitness+= Math.abs(min);
        }
    }

    return population;
}

var normalize_fitness = (population) => {
    var fitness_values = [];
    var sum = 0;

    for(var i=0;i<population.length;i++){
        fitness_values.push(population[i].fitness);
        sum += population[i].fitness;
    }

    var normalized_values = [];

    for(var i=0;i<population.length;i++){
        normalized_values.push(fitness_values[i]/sum);
    }

    return normalized_values;
}

var calculate_cumulative_sums = (normalized_values) => {
    var cumulative_sums = [];

    for(var i=0;i<normalized_values.length;i++){
        cumulative_sums.push(0);
    }

    for(i=0;i<normalized_values.length;i++){
        for(var j=0;j<normalized_values.length;j++){
            if(j>=i){
                cumulative_sums[i] = cumulative_sums[i] + normalized_values[j];
            }
        }
    }

    return cumulative_sums;
}

var chose_parents = (cumulative_sums,population) => {
    var parent_index1 = 0;
    var parent_index2 = 0;

    while (parent_index1===parent_index2){
        //first parent
        var r = Math.random();
        for(var i=0;i<cumulative_sums.length;i++){
            if(r<=cumulative_sums[i]){
                parent_index1 = i;
            }
        }

        //second parent
        r = Math.random();

        for(var j=0;j<cumulative_sums.length;j++){
            if(r<=cumulative_sums[j]){
                parent_index2 = j;
            }
        }
    }

    return [population[parent_index1],population[parent_index2]];
}

var crossover = (parent1,parent2) => {
    var child1 = new chromosome();
    var child2 = new chromosome();

    var crossover_type = Math.random();

    if(crossover_type<0.5){
        //singlepoint crossover
        var random_point = Math.floor(Math.random() * parent1.genes.length);

        for(var i=0;i<child1.genes.length;i++){

            var mutate = Math.random();
            if(mutate<mutation_chance){
                console.log("mutation "+mutate+" "+mutation_chance);
                child1.genes[i] = positions[(Math.random() * positions.length) | 0];
                child2.genes[i] = positions[(Math.random() * positions.length) | 0];
            }else if(i<random_point){
                child1.genes[i] = parent1.genes[i];
                child2.genes[i] = parent2.genes[i];
            }else{
                child1.genes[i] = parent2.genes[i];
                child2.genes[i] = parent1.genes[i];
            }
        }
    }else{
        //doublepoint crossover
        var point1 = 0;
        var point2 = 0;

        while (point1===point2){
            var point1 = Math.floor(Math.random() * parent1.genes.length);
            var point2 = Math.floor(Math.random() * parent1.genes.length);

            var minimum = Math.min(point1,point2);
            var maximum = Math.max(point1,point2);

            for(var i=0;i<child1.genes.length;i++){
                var mutate = Math.random();
                if(mutate<mutation_chance){
                    console.log("mutation "+mutate+" "+mutation_chance);
                    child1.genes[i] = positions[(Math.random() * positions.length) | 0];
                    child2.genes[i] = positions[(Math.random() * positions.length) | 0];
                }else if(i<minimum){
                    child1.genes[i] = parent1.genes[i];
                    child2.genes[i] = parent2.genes[i];
                }else if(i>=minimum && i < maximum){
                    child1.genes[i] = parent2.genes[i];
                    child2.genes[i] = parent1.genes[i];
                }else{
                    child1.genes[i] = parent1.genes[i];
                    child2.genes[i] = parent2.genes[i];
                }
            }
        }
    }



    //TODO: double point crossover

    return [child1,child2];
}

/*initial population*/
var population = make_population();

var interval = setInterval(()=>{
    if(counter>=lifetime){
        /*SELECTION*/

        /*calculate fitness value*/
        for(var i = 0;i<population.length;i++){
            population[i].fitness_function();
        }

        /*fitness scaling*/
        population = fitness_scaling(population);

        //sort population by fitness
        population.sort((a, b) => {
            return b.fitness - a.fitness;
        })

        //normalize fitness values
        var normalized_values = normalize_fitness(population);

        //cumulative_sums
        var cumulative_sums = calculate_cumulative_sums(normalized_values);

        var new_population = [];

        for(var i=0;i<population.length/2;i++){
            var parent1, parent2;

            [parent1,parent2] = chose_parents(cumulative_sums,population);

            var child1, child2;

            [child1,child2] = crossover(parent1,parent2);

            new_population.push(child1);
            new_population.push(child2);

        }


        population = new_population;
        counter = 0;

        //clearInterval(interval);
        return;
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, ground_width, ground_height);

    for(var i=0;i<population.length;i++){
        ctx.fillStyle = population[i].color;
        population[i].move();
        population[i].draw();
    }

    ctx.stroke();

    counter++;
},20);


