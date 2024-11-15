const {chores} = require("./constants");

function get_speciesism(users, scores) {
    return {
        type: 'bar',
        data: {
            labels: users,
            datasets: [
                {
                    label: 'Speciesist Utterances',
                    data: scores,
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.2)",
                        "rgba(255, 159, 64, 0.2)",
                        "rgba(255, 205, 86, 0.2)",
                        "rgba(75, 192, 192, 0.2)",
                        "rgba(54, 162, 235, 0.2)",
                    ],
                    borderColor: [
                        "rgb(255, 99, 132)",
                        "rgb(255, 159, 64)",
                        "rgb(255, 205, 86)",
                        "rgb(75, 192, 192)",
                        "rgb(54, 162, 235)",
                    ],
                    fill: false,
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                yAxes: [
                    {
                        ticks: {
                            beginAtZero: true,
                            stepSize: 1
                        }
                    }
                ]
            }
        }
    }
}

function get_chores(userChores) {
    const users = Object.keys(userChores)
    return {
        type: 'bar',
        data: {
            labels: users,
            datasets: chores.map(chore => {
                return {
                    label: chore.label,
                    data: users.map(user => userChores[user][chore.field]),
                    backgroundColor: `rgba(${chore.color[0]}, ${chore.color[1]}, ${chore.color[2]}, 0.2)`,
                    borderColor: `rgb(${chore.color[0]}, ${chore.color[1]}, ${chore.color[2]})`,
                    fill: false,
                    borderWidth: 1
                }
            }),
        },
        options: {
            scales: {
                yAxes: [
                    {
                        ticks: {
                            beginAtZero: true,
                            stepSize: 1
                        }
                    }
                ]
            }
        }
    }
}

function chart(input) {
    return "https://quickchart.io/chart?c=" + JSON.stringify(input)
}

module.exports = {
    chart,
    get_speciesism,
    get_chores
}