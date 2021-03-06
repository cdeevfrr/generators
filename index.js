    document.addEventListener(`DOMContentLoaded`, () => {
        loadInputsFromURL()
    })
    
    function loadInputsFromURL(){
        const inputsString = new URLSearchParams(window.location.search).get(`inputs`)
        const inputs = JSON.parse(decodeURIComponent(inputsString))

        // make sure there are enough generators and then fill them all in
        inputs.generators.slice(1).forEach(addBlankGenerator)
        

        if (inputs.generators.length == 0) return
        
        for (const [index, htmlGenerator] of getAllHtmlGenerators().entries()){
            const generatorObject = inputs.generators[index]
            for (const key in generatorObject){
                htmlGenerator.querySelector(`input[name="${key}"]`).value = generatorObject[key]
            }
        }
    }

    /**
     * @return {Array<HTMLElement>}
     */
    function getAllHtmlGenerators(){
        return Array.from(document.querySelectorAll(`#generators > section`)).slice(0, -1) // slice to remove the 'add another' section at the end that isn't actually a generator
    }

    function addBlankGenerator() {
        const clone = getBaseGenerator().cloneNode(true)

        document.querySelector(`#addGenerator`).before(clone)

        for (const input of clone.querySelectorAll(`input`)) {
            input.value = ``
        }

        const deleteButton = clone.querySelector(`.hidden`)

        deleteButton.classList.remove(`hidden`)
    }

    function getBaseGenerator() {
        return document.querySelector(`#generators > section`)
    }

    /**
     * @return {{
     *   generators: Array<{
     *     name: string
     *     cost: number
     *     income: number
     *   }>
     * }}
     */
    function getInputs() {
        return {
            generators: getAllHtmlGenerators().map(generatorElement => {
                return Array.from(generatorElement.querySelectorAll(`input`)).reduce((data, input) => {
                    data[input.name] = input.type === `number` ? Number(input.value) : input.value

                    return data
                }, {})
            })
        }
    }

    function simulate() {
        const inputs = getInputs()
        updateWindowURL(inputs)

        const generators = inputs.generators

        if (generators.length > 10) {
          alert(`There can't be more than 10 generators because of the way we turn numbers into strategies. See the 'nextStrategy' variable.`)
          throw new Error(`see alert`)
        }

        if (generators.length < 2) {
            alert(`There need to be at least 2 generators for a meaningful simulation.`)
            throw new Error(`see alert`)
        }

        const startingMoney = 0
        const startingIncome = 1

        // Make a strategy for each generator
        // Drop the ones that are strictly beaten by others
        //   where strictly beaten means "All resources (money, time, ...) are higher, and income is higher, in one strategy, at a given timestep."
        // Make all children from the winners, by appending all generators.

        // Note that if one strategy strictly beats another, that DOESN'T MEAN that no children (children = append something to the parent) of the other can beat the first.
        // Ex, [small] & [big]: big eventually strictly beats small, but it takes lots of timesteps. But it might turn out that [small, big, big] beats all combos of [big, big, ...]
        // It is clear that if a strategy strictly beats another before the other is complete with its purchases, then the other no longer needs to be considered.
        
        const computationTimeLimit = 1e3 * 2
        const timestepsPerStrategy = 40
        const winningStrategies = [newStrategy([0])]


        const startTime = Date.now()
        let strategyNumber = 0

        while(Date.now() - startTime < computationTimeLimit){
          /**
           * @type{ Array<ReturnType<typeof newStrategy>>}
           */ 
          for (let i = 0; i < 1e2; i += 1) {
            // Note - this only works if there are at most 10 generators
            const nextStrategy = newStrategy(strategyNumber.toString(generators.length).split('').map(digit => Number(digit)).reverse())
            strategyNumber += 1

            runForTimesteps(generators, nextStrategy, timestepsPerStrategy)

            if (nextStrategy.currentMoney >= winningStrategies[winningStrategies.length - 1].currentMoney){
                winningStrategies.push(nextStrategy)
                winningStrategies.sort((strategy1, strategy2) => strategy2.currentMoney - strategy1.currentMoney)
                if (winningStrategies.length > 20){
                    winningStrategies.pop()
                }
            }
          }
          
        }

        const resultsTableBody = document.querySelector(`#results > table > tbody`)
        // Remove all existing rows from the results table.
        resultsTableBody.innerHTML = ``
        const numToShow = 3
        winningStrategies.slice(0,numToShow).forEach(strategy => {
            const row = document.createElement(`tr`)
            const strategyPurchaseOrderString = strategy.generatorList.map(generatorIndex => generators[generatorIndex].name).join(',')
            row.innerHTML = `
                <td>${strategyPurchaseOrderString}</td>
                <td>${strategy.currentMoney}</td>
                <td>${strategy.currentIncome}</td>
            `
            resultsTableBody.appendChild(row)
        })
        
        console.log(winningStrategies)        

        // graph(winningStrategies)
    }

    /**
     * @param {ReturnType<typeof getInputs>} inputs
     */
    function updateWindowURL(inputs){
        // See https://developer.mozilla.org/en-US/docs/Web/API/History/pushState since the arguments are weird
        window.history.pushState(null, ``, `/?inputs=${encodeURIComponent(JSON.stringify(inputs))}`)
    }

    /**
     * @param {ReturnType<typeof getGenerators>} generators
     * @param {ReturnType<typeof newStrategy>} strategy
     * @param {number} timesteps
     */
    function runForTimesteps(generators, strategy, timesteps){
        for (let i = 0; i < timesteps; i += 1){
            strategy.currentMoney += strategy.currentIncome
            strategy.timesteps += 1
            if (strategy.currentGeneratorListIndex < strategy.generatorList.length){
                const nextGenerator = generators[strategy.generatorList[strategy.currentGeneratorListIndex]]
                // TODO make it so that you can buy multiple generators in one timestep
                if (strategy.currentMoney >= nextGenerator.cost){
                    strategy.currentMoney -= nextGenerator.cost
                    strategy.currentIncome += nextGenerator.income
                    strategy.currentGeneratorListIndex += 1
                }
            } 
        }
    }

    /**
     * @return{{generatorList: Array<number>, currentGeneratorListIndex: number, currentIncome: number, currentMoney: number, timesteps: number }}
     */ 
    function newStrategy(generatorList){
        return {
                generatorList,
                currentGeneratorListIndex: 0,
                currentIncome: 1,
                currentMoney: 0,
                timesteps: 0
            }
    }



    /**
     * A strategy is a purchase ordering of generators.
     * 
     * You may or may not actualy purchase all of them before running out of time/resources, but a strategy like:
     * 0, 1, 0, 0
     * means to purchase generator 0 as soon as possible, then purchase generator 1, then zero again, then zero again.
     * 
     * If we need time dependent purchases in the future, we will add a special "wait" generator that a strategy can choose to buy at any given time.
     * We considered having strategies say when to purchase each generator, but that leads to feasibility issues (a strategy that can't be done?) and is more complicated than adding a wait step in the strategy.
     * 
     * 
     * We will compare all strategies lenght 1,
     * then all length 2 from the winners, 
     * then all length 3 from those winners....
     * 
     * We will compute for a fixed time, and then report what we got.
     */

    function graph() {
        const canvas = document.querySelector(`#graph`)

        new Chart(canvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: '# of Votes',
                    data: [
                        { x: 0, y: 1 },
                        { x: 1, y: 1.3 },
                        { x: 2, y: 1.2 },
                        { x: 3, y: 1.35 },
                    ],
                    elements: {
                        point: {
                            radius: 7,
                        }
                    }
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
            }
        })
    }