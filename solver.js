
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
 * We will compare all strategies length 1,
 * then all length 2 from the winners, 
 * then all length 3 from those winners....
 * 
 * We will compute for a fixed time, and then report what we got.
 */

/**
 *  **** Strictly beaten strategies ****
 * 
 * Define a strategy as "strictly beaten" by another strategy if, in the other strategy:
 *   - all resources (money, time, ...) are higher, 
 *   - and income is higher, 
 *   - at some timestep.
 * 
 * Note that if one strategy strictly beats another, we still haven't settled the question of the two strategy's children.
 * For example, if we have a smallCheap generator & a bigExpensive generator, starting with a small drip income, consider the two strategies [small] & [big].
 * [big] eventually strictly beats [small], but it takes lots of timesteps because [big] has to wait FOREVER to buy the first generator, given only the drip income.
 * So it could easily turn out that [small, big] strictly beats [big] because you can buy the big generator sooner with the extra income from small.
 * In that case, [small, big, x] beats [big, x] so we can completely drop [big] and all its children.
 * 
 * In general, if a strategy strictly beats another BEFORE THE OTHER IS COMPLETE with its purchases, then the other and its children no longer need to be considered.
 * 
 * 
 * Consider, at timestep t, we are comparing:
 *    strategy s1 = [a1, a2, ..., an,    x1, x2, ... xn]
 *    strategy s2 = [b1, b2, ..., bn,    y1, y2, ... yn]
 * 
 * where the as and bs have been purchased, but the x and y have not.
 * If s1 strictly beats s2 at this timestep, then
 *  s3 = [as, ys]
 * will also strectly beat 
 *  s2 = [bs, ys]
 * at all future timesteps, as s3 will purchase the same things as s2 just faster.
 * 
 * Since there are a finite number of choices [a1...an] or [b1...bn] 
 * there must be some [p1...pn] so that there is no choice of [a1 ... an] that strictly beats [p1 ... pn] in this way.
 * (informally, this [p1...pn] will be on an efficient boundary in the current-money/current-income 2d space of strategies, at this timestep)
 * 
 * 
 * 
 * 
 */

        




/**
 * 
 * @param {Array<{cost: number, income: number}>} generators 
 * @param {number} computationalTimeLimitMs
 * @return {Array<Strategy>}
 */
function solve(generators, computationalTimeLimitMs){
    const timestepsPerStrategy = 40
    const winningStrategies = [newStrategy([0])]


    const startTime = Date.now()
    let strategyNumber = 0 // order all possible strategies and assign a number to them. We'll increment that number to iterate over strategies.

    while(Date.now() - startTime < computationalTimeLimitMs){
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
    return winningStrategies
}



/**
 * @param {Array<{cost: number, income: number}>} generators
 * @param {Strategy} strategy
 * @param {number} timesteps
 */
    function runForTimesteps(generators, strategy, timesteps){
    for (let i = 0; i < timesteps; i += 1){
        strategy.currentMoney += strategy.currentIncome
        strategy.timesteps += 1
        if (strategy.currentGeneratorListIndex < strategy.generatorOrder.length){
            const nextGenerator = generators[strategy.generatorOrder[strategy.currentGeneratorListIndex]]
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
 * @typedef {{
 *   generatorOrder: Array<number>, 
 *   currentGeneratorListIndex: number, 
 *   currentIncome: number, 
 *   currentMoney: number, 
 *   timesteps: number 
 * }} Strategy
 */

/**
 * @return {Strategy}
 */ 
function newStrategy(generatorOrder){
    return {
            generatorOrder,
            currentGeneratorListIndex: 0,
            currentIncome: 1,
            currentMoney: 0,
            timesteps: 0
        }
}