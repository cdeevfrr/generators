


## See blue folder / ideas & thoughts / investing fundamentals for the motivation for this program

def buyOnlyMachine(machineCost,
                   machineAllowanceIncrease,
                   currentMoney,
                   currentAllowance,
                   timesteps):
    for timestep in range(timesteps):
        currentMoney += currentAllowance
        machinesBought = currentMoney // machineCost
        currentMoney = currentMoney % machineCost
        currentAllowance += machineAllowanceIncrease * machinesBought
        print(timestep, currentMoney, currentAllowance)
    return {"currentAllowance": currentAllowance, "currentMoney": currentMoney}
        
    
### Ok, let's make something that searches for "good" solutions to these things.
## Genetic algorithm should work.

## I'll make a list of machines, members of the population look like
## [m1, m1, m1, m2, m6]
## and that means "buy machine 1 as soon as possible. Then machine 1. Then m1.
##    then m2. Then m6. Then keep buying m6 until the end of time."


## It should be relatively easy to compare two machines - just simulate until
# one of them is strictly better (currentAllowance and currentMoney are both more).


from functools import total_ordering

class Machine:
    def __init__(self, cost, allowanceIncrease):
        self.cost = cost
        self.allowanceIncrease = allowanceIncrease
        

machines = [
    Machine(5, .5),  # $1/$10
    Machine(20, 4),  # $2/$10
    Machine(100,30), # $3/$10
]

@total_ordering
class Strategy:
    def __init__(self, ordering):
        for machineIndex in ordering:
            if(machineIndex > len(machines) - 1 or machineIndex < 0):
                raise "Tried to make a strategy that uses a nonexistent machine"
        if (len(ordering) < 1):
            raise "Tried to make a strategy with an empty ordering"
        self.ordering = ordering
        self.reset()

    def __lt__(self, other):
        # Example usage: return self.money < other.money
        self.reset()
        other.reset()

        # If the last machine is the same, go for 1000 timesteps. Otherwise
        # go until you get a winner.
        i=0
        while(self.ordering[-1] != other.ordering[-1] or i < 100):
            i += 1
            if self.currentMoney < other.currentMoney and self.currentAllowance < other.currentAllowance:
                print("compared " + str(self.ordering) + " less than " + str(other.ordering)
                      + " with money,allowance of " + str([self.currentMoney,
                                                         self.currentAllowance,
                                                         other.currentMoney,
                                                         other.currentAllowance])
                      + " in " + str(i) + " timesteps"
                      )
                return True
            if self.currentMoney > other.currentMoney and self.currentAllowance > other.currentAllowance:
                print("compared " + str(self.ordering) + " greater than " + str(other.ordering)
                      + " with money,allowance of " + str([self.currentMoney,
                                                         self.currentAllowance,
                                                         other.currentMoney,
                                                         other.currentAllowance])
                      + " in " + str(i) + " timesteps"
                      )
                return False
            self.timestep()
            other.timestep()
        return False

        

    def __eq__(self, other):
        self.ordering == other.ordering

    def reset(self):
        self.currentMoney = 0
        self.currentAllowance = 1
        self.machines = [0 for _ in machines]
        self.orderingIndex = 0

    def timestep(self):
        self.currentMoney += self.currentAllowance
        nextMachine = machines[self.ordering[self.orderingIndex]]
        while(self.currentMoney >= nextMachine.cost):
            ## Purchase that machine
            self.currentMoney -= nextMachine.cost
            self.machines[self.ordering[self.orderingIndex]] += 1
            self.currentAllowance += nextMachine.allowanceIncrease

            # increment machine pointer
            if(self.orderingIndex < len(self.ordering) - 1):
                self.orderingIndex += 1
                nextMachine = machines[self.ordering[self.orderingIndex]]

    def __repr__(self):
        return str({"ordering": self.ordering,
                "orderingIndex": self.orderingIndex,
                "currentMoney": self.currentMoney,
                "currentAllowance": self.currentAllowance,
                "machines":self.machines,
                })
        
    


## sorting this gave the ordering:
### [
#    [0, 0, 1, 0, 0, 1], [0, 0, 1, 0, 1], [0, 0, 0, 0, 0, 1], [0, 0, 0, 0, 1],
#    [0, 0, 0, 1, 0, 1],
#    [0, 0, 0, 1, 0, 1],
#    [0, 0, 0, 1]
# ]
# (note that the later entries have more money, so winner is 0,0,0,1
#machines = [
#    Machine(5, .5),  # $1/$10
#    Machine(20, 4),  # $2/$10
#    Machine(100,30), # $3/$10
#]
#strategiesToCompare = [
#    Strategy([0,0,0,1]),
#    Strategy([0,0,0,0,1]),
#    Strategy([0,0,0,0,0,1]),
#    Strategy([0,0,0,1,0,1]),
#    Strategy([0,0,0,1,0,1]),
#    Strategy([0,0,1,0,0,1]),
#    Strategy([0,0,1,0,1]),
#    ]




# Running this one got these results:
# [[0, 0, 0, 1, 1, 2], [0, 0, 0, 1, 0, 1, 2], [0, 0, 0, 1], [0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], [0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 2], [0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2], [0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2], [0, 0, 0, 1, 0, 1, 1, 1, 1, 2], [0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 2], [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 2], [0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 2], [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2]]
#strategiesToCompare = [
#    Strategy([0,0,0,1]),
#    Strategy([0,0,0,1,1,1,1,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,1,1,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,1,1,1,1,1,1,2]), # Good? 
#    Strategy([0,0,0,1,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,1,2]),
#    Strategy([0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,0,1,1,1,1,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,0,1,1,1,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,0,1,1,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,0,1,1,1,1,1,1,2]), # Good?
#    Strategy([0,0,0,1,0,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,0,1,1,1,1,2]),
#    Strategy([0,0,0,1,0,1,2]),
#    ]


### This one, interestingly enough, gave this output:
# [[0, 0, 0, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 0, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 0, 2],
# [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2]]
# I'm starting to lose the ability to guess what'll win.
# It looks like there are rounding effects that might impact the answer,
# (eg if you have the extra cash this round, buy a machine 0)
# which makes me think that a genetic algorithm is the thing to do...
#strategiesToCompare = [
#    Strategy([0,0,0,1,1,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,1,1,1,1,1,1,2,1,2]),
#    Strategy([0,0,0,1,1,1,1,1,1,1,2,1,1,2]),
#    Strategy([0,0,0,1,1,1,1,1,1,1,2,1,1,1,2]),
#    Strategy([0,0,0,1,1,1,1,1,1,1,2,1,1,1,1,2]),
#    Strategy([0,0,0,1,1,1,1,1,1,1,2,0,2]),
#    Strategy([0,0,0,1,1,1,1,1,1,1,2,0,1,2]),
#    
#    Strategy([0,0,0,1,1,1,1,1,2]),
#    Strategy([0,0,0,1,1,1,1,1,2,1,1,1,2]),
#    ]



# It looks like, for most of these, they don't compare eq and they don't compare lt so they're called GT over and over.
# Causes an infinite loop while sorting.
strategiesToCompare = [
    Strategy([0,0,0,1,1,1,1,1,1,1,2,1,2]),
    Strategy([0,0,0,1,0,1,1,1,1,1,1,2,1,2]),
    Strategy([0,0,0,1,1,0,1,1,1,1,1,2,1,2]),
    Strategy([0,0,0,1,1,1,0,1,1,1,1,2,1,2]),
    Strategy([0,0,0,1,1,1,1,0,1,1,1,2,1,2]),
    Strategy([0,0,0,1,1,1,1,1,0,1,1,2,1,2]),
    Strategy([0,0,0,1,1,1,1,1,1,0,1,2,1,2]),
    Strategy([0,0,0,1,1,1,1,1,1,1,0,2,1,2]),
    Strategy([0,0,0,1,1,1,1,1,1,1,2,0,1,2]),
    Strategy([0,0,0,1,1,1,1,1,1,1,2,1,0,2]),

    ]

