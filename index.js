    document.addEventListener(`DOMContentLoaded`, () => {
        loadInputsFromURL()
    })
    
    function loadInputsFromURL(){
        const inputsString = new URLSearchParams(window.location.search).get(`inputs`)
        if(!inputsString){
            return
        }

        const inputs = JSON.parse(decodeURIComponent(inputsString))

        // make sure there are enough generators and then fill them all in
        // The first blank generator is already written in the HTML directly.
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

        const computationTimeLimit = 1e3 * 2
        const winningStrategies = solve(generators, computationTimeLimit)

        const resultsTableBody = document.querySelector(`#results > table > tbody`)
        // Remove all existing rows from the results table.
        resultsTableBody.innerHTML = ``
        const numToShow = 3
        winningStrategies.slice(0,numToShow).forEach(strategy => {
            const row = document.createElement(`tr`)
            const strategyPurchaseOrderString = strategy.generatorOrder.map(generatorIndex => generators[generatorIndex].name).join(',')
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