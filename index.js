#!/usr/bin/env node

const commander = require('commander')
const inquirer = require('inquirer')
const fs = require('fs-extra')
const open = require('open')

const results = []

const path = require('path')

commander
.version(require("./package.json").version)
.description('Cutting the complexity in the making of a documentation')

commander
.command('create')
.description('Create the documentation')
.action(() => create())

commander
.command('create-replace')
.description('Create the documentation with replacing recent documentation')
.action(() => createReplace())

commander
.command('clear-cache')
.description('Clear crocodocs caches')
.action(() => clearCache())

commander
.command('erase-all')
.description('Erase all user crocodocs comments in the project and clear all the caches')
.action(() => eraseAll())

commander.parse(process.argv)

function create() {
    const files = getAllFilesObject('.')

    if(files.length > 0) {
        readFile(files[files.length - 1])
    }
}

function readFile(file) {
    fs.readFile(file.path, {encoding: 'utf-8'}, function(err, data) {
        if (err) throw error

        //if(file.path != "./index.js") { //DELETE THIS WHEN NOT TESTING
            let lines = data.split('\n')

            for(let i = 0; i < lines.length; i++) {
                const lowercasedLine = lines[i].toLowerCase()

                const isHavingData = lowercasedLine.includes("//des ") || lowercasedLine.includes("//fun ") || lowercasedLine.includes("//var ")

                let alreadyRegisteredInIndex = -1

                for(let j = 0; j < results.length; j++) {
                    if(results[j].filePath == file.path) {
                        alreadyRegisteredInIndex = j

                        break
                    }
                }

                if(isHavingData) {
                    if(alreadyRegisteredInIndex == -1) {
                        results.push(
                            {
                                filePath: file.path,
                                description: "",
                                elements: []
                            }
                        )
                    }

                    alreadyRegisteredInIndex = results.length - 1

                    const pickedResult = results[alreadyRegisteredInIndex]

                    if(lowercasedLine.includes("//des ")) {
                        pickedResult.description = lines[i].trim().substring(6, lines[i].length)
                    } else if(lowercasedLine.includes("//fun ")) {
                        pickedResult.elements.push({
                            ...GetNameTypeAndDescription(lines[i]),
                            elementType: "function",
                            parameters: []
                        })

                        let parameterFoundAtNextLine = 1

                        while(parameterFoundAtNextLine != -1) {
                            let nextLine = lines[i + parameterFoundAtNextLine]

                            let lowercasedNextLine = nextLine.toLowerCase()

                            if(lowercasedNextLine.includes("//param")) {
                                pickedResult.elements[pickedResult.elements.length - 1].parameters.push(GetNameTypeAndDescription(nextLine))

                                parameterFoundAtNextLine++
                            } else {
                                parameterFoundAtNextLine = -1
                            }
                        }
                    } else if(lowercasedLine.includes("//var ")) {
                        pickedResult.elements.push({
                            ...GetNameTypeAndDescription(lines[i]),
                            elementType: "variable",
                        })
                    }
                }
            }
        //}

        if(file.nextFile != null) {
            readFile(file.nextFile)
        } else {
            if(results.length > 0) {
                const fs = require('fs')

                if (!fs.existsSync('crocodocs')){
                    fs.mkdirSync('crocodocs')
                }

                if (!fs.existsSync('crocodocs/documentation')){
                    fs.mkdirSync('crocodocs/documentation')
                }

                if (fs.existsSync('crocodocs/documentation/index.html') && fs.existsSync('crocodocs/documentation/styles.css')){
                    if (!fs.existsSync('crocodocs/old_documentation')){
                        fs.mkdirSync('crocodocs/old_documentation')
                    }

                    let revisionNumber = 1

                    while(fs.existsSync('crocodocs/old_documentation/' + revisionNumber.toString())) {
                        ++revisionNumber
                    }

                    fs.mkdirSync('crocodocs/old_documentation/' + revisionNumber.toString())

                    fs.rename('crocodocs/documentation/index.html', 'crocodocs/old_documentation/' + revisionNumber.toString() + '/index.html', (err) => {
                        if (err) throw err

                        fs.rename('crocodocs/documentation/styles.css', 'crocodocs/old_documentation/' + revisionNumber.toString() + '/styles.css', (err) => {
                            if (err) throw err

                            SetupNewDocumentation()
                        })
                    })
                } else {
                    SetupNewDocumentation()
                }
            } else {
                const chalk = require('chalk')

                console.log(chalk.default.yellow("\nNo data found to be documented, nothing changes!\n"))
            }
        }
    })
}

function SetupNewDocumentation() {
    const fileName = 'crocodocs/documentation/index.html'

    fs.copyFile(__dirname + '/resources/styles.css', 'crocodocs/documentation/styles.css', (err) => {
        if (err) throw err
        
        fs.copyFile(__dirname + '/resources/documentation-source.html', fileName, (err) => {
            if (err) throw err

            let data = fs.readFileSync(fileName, 'utf-8')

            let newValue = data.replace("const array = []", "const array = " + JSON.stringify(results, null, 4))

            newValue = newValue.replace("[DATE]", (new Date()).toDateString())

            if (!fs.existsSync('crocodocs/preferences.json')){
                const styles = {
                    colors: {
                        navbar: "mediumseagreen",
                        title: "rgb(255,255,255)",
                        date: "#000",
                        list_container: "rgb(50,50,50)",
                        list_of_contents_title: "rgb(255,255,255)", 
                        side_nav_link: "aquamarine",
                        folder: "gainsboro",
                        content_container: "#000",
                        beginning_header: "white",
                        beginning_text: "gainsboro",
                        beginning_list: "gainsboro",
                        script_name: "rgb(255,255,255)",
                        type: "red",
                        name: "gold",
                        description: "lightgray",
                        param_type: "greenyellow",
                        param_name: "gold",
                        param_description: "darkgray"
                    },
                    font_family: "'Lucida Console', Monaco, monospace"
                }

                styles.name = path.basename(path.resolve("."))

                fs.writeFileSync('crocodocs/preferences.json', JSON.stringify(styles, null, "\t"), 'utf-8')
            }

            if (!fs.existsSync('crocodocs/beginning.json')){
                fs.writeFileSync('crocodocs/beginning.json', "[]", 'utf-8')
            }

            fs.readFile('crocodocs/beginning.json', {encoding: 'utf-8'}, function(err, data) {
                if (err) throw error

                const beginning = JSON.parse(data)

                newValue = newValue.replace("const beginning = []", "const beginning = " + JSON.stringify(beginning, null, 4))

                fs.readFile('crocodocs/preferences.json', {encoding: 'utf-8'}, function(err, data) {
                    if (err) throw error

                    const json = JSON.parse(data)

                    let projectName = path.basename(path.resolve("."))

                    newValue = newValue.replace("[PROJECT_NAME_TITLE]", json.name || projectName)

                    newValue = newValue.replace("[PROJECT_NAME]", json.name || projectName)

                    if(typeof json.colors === 'object') {
                        let styles = fs.readFileSync('crocodocs/documentation/styles.css', 'utf-8')

                        let fontFamily = json.font_family

                        if(fontFamily != undefined) {
                            styles = styles.replace("/*font_family*/font-family: 'Lucida Console', Monaco, monospace", "/*font_family*/font-family: " + fontFamily)
                        }

                        const colors = json.colors

                        if(colors != undefined) {
                            if(colors.navbar != undefined) {
                                styles = styles.replace("/*navbar*/background-color: crimson", "/*navbar*/background-color: " + colors.navbar)
                            }
        
                            if(colors.title != undefined) {
                                styles = styles.replace("/*title*/color: white", "/*title*/color: " + colors.title)
                            }

                            if(colors.date != undefined) {
                                styles = styles.replace("/*date*/color: black", "/*date*/color: " + colors.date)
                            }
        
                            if(colors.list_container != undefined) {
                                styles = styles.replace("/*list_container*/background-color:rgb(50,50,50)", "/*list_container*/background-color: " + colors.list_container)
                            }
        
                            if(colors.content_container != undefined) {
                                styles = styles.replace("/*content_container*/background-color:#000", "/*content_container*/background-color: " + colors.content_container)
                            }
        
                            if(colors.list_of_contents_title != undefined) {
                                styles = styles.replace("/*list_of_contents_title*/color: white", "/*list_of_contents_title*/color: " + colors.list_of_contents_title)
                            }
        
                            if(colors.side_nav_link != undefined) {
                                styles = styles.replace("/*side_nav_link*/color: aquamarine", "/*side_nav_link*/color: " + colors.side_nav_link)
                            }
        
                            if(colors.folder != undefined) {
                                styles = styles.replace("/*folder*/color:gainsboro", "/*folder*/color: " + colors.folder)
                            }

                            if(colors.beginning_header != undefined) {
                                styles = styles.replace("/*beginning_header*/color: white", "/*beginning_header*/color: " + colors.beginning_header)
                            }

                            if(colors.beginning_text != undefined) {
                                styles = styles.replace("/*beginning_text*/color: gainsboro", "/*beginning_text*/color: " + colors.beginning_text)
                            }

                            if(colors.beginning_list != undefined) {
                                styles = styles.replace("/*beginning_list*/color: gainsboro", "/*beginning_list*/color: " + colors.beginning_list)
                            }
        
                            if(colors.script_name != undefined) {
                                styles = styles.replace("/*script_name*/color: white", "/*script_name*/color: " + colors.script_name)
                            }
        
                            if(colors.type != undefined) {
                                styles = styles.replace("/*type*/color: red", "/*type*/color: " + colors.type)
                            }
        
                            if(colors.name != undefined) {
                                styles = styles.replace("/*name*/color: gold", "/*name*/color: " + colors.name)
                            }
        
                            if(colors.description != undefined) {
                                styles = styles.replace("/*description*/color: lightgray", "/*description*/color: " + colors.description)
                            }
        
                            if(colors.param_type != undefined) {
                                styles = styles.replace("/*param_type*/color: greenyellow", "/*param_type*/color: " + colors.param_type)
                            }
        
                            if(colors.param_name != undefined) {
                                styles = styles.replace("/*param_name*/color: gold", "/*param_name*/color: " + colors.param_name)
                            }
        
                            if(colors.param_description!= undefined) {
                                styles = styles.replace("/*param_description*/color: darkgray", "/*param_description*/color: " + colors.param_description)
                            }
                        }

                        fs.writeFileSync('crocodocs/documentation/styles.css', styles, 'utf-8')
                    }

                    fs.writeFileSync(fileName, newValue, 'utf-8')

                    const chalk = require('chalk')

                    console.log(chalk.default.green("\nYour documentation has been created at ./crocodocs/documentation/index.html\n"))

                    open(fileName)
                })
            })
        })
    })
}

function GetNameTypeAndDescription(theLine) {
    let line = theLine.split("//")[theLine.split("//").length - 1]

    const splittedText = line.split(';')

    const typeString = splittedText[0].trim()

    const type = typeString.split(" ").length == 2 ? typeString.split(" ")[1] : ""

    return {
        name: splittedText[1].trim(),
        type: type,
        description: splittedText[2].trim()
    }
}

//File Helpers

function getAllFilesObject(dirPath) {
    let allFilesPath = getListAllFilesPath(dirPath).reverse()

    const files = []

    let previousFile = null

    for(const path of allFilesPath) {
        const newFile = {
            path: path,
            nextFile: previousFile
        }

        files.push(newFile)

        previousFile = newFile
    }

    return files
}

function getListAllFilesPath(dirPath, files_) {
    files_ = files_ || []

    const files = fs.readdirSync(dirPath)

    for (const file of files){
        const name = dirPath + '/' + file

        if (fs.statSync(name).isDirectory()){
            getListAllFilesPath(name, files_)
        } else {
            files_.push(name)
        }
    }

    return files_
}

function clearCache() {
    if (!fs.existsSync('crocodocs')) {
        console.log('\nNothing to clear!\n')
    } else {
        console.log("")

        inquirer.prompt([
            {
                name: "clearCacheValidation",
                type: "list",
                message: "Are you sure want to clear all the documentation caches?",
                choices: [
                    {
                        value: "No"
                    },
                    {
                        value: "Yes"
                    }
                ]
            }
        ])
        .then(answers => {
            if(answers.clearCacheValidation == "Yes") {
                fs.removeSync('crocodocs')
            
                const chalk = require('chalk')

                console.log(chalk.default.yellow("\nCaches cleared!\n"))
            } else {
                console.log("")
            }
        })
    }
}

function eraseAll() {
    console.log("")

    inquirer.prompt([
        {
            name: "eraseAllValidation",
            type: "list",
            message: "Are you sure want to erase all crocodocs comments and caches in the current project folder?",
            choices: [
                {
                    value: "No"
                },
                {
                    value: "Yes"
                }
            ]
        }
    ])
    .then(answers => {
        if(answers.eraseAllValidation == "Yes") {
            if (fs.existsSync('crocodocs')) {
                fs.removeSync('crocodocs')   
            }

            const files = getAllFilesObject('.')

            if(files.length > 0) {
                readFileErase(files[files.length - 1])
            }
        } else {
            console.log("")
        }
    })
}

function readFileErase(file) {
    fs.readFile(file.path, {encoding: 'utf-8'}, function(err, data) {
        if (err) throw error

        //if(file.path != "./index.js") { //DELETE THIS WHEN NOT TESTING
            let lines = data.split('\n')

            for(let i = 0; i < lines.length; i++) {
                const lowercasedLine = lines[i].toLowerCase()

                const isHavingData = lowercasedLine.includes("//des ") || lowercasedLine.includes("//fun ") || lowercasedLine.includes("//var ") || lowercasedLine.includes("//param ")
                
                if(isHavingData) {
                    let comment = lines[i].split("//")[lines[i].split("//").length - 1]
                    
                    lines[i] = lines[i].replace(comment, "")

                    lines[i] = lines[i].substring(0, lines[i].length - 3)

                    if(lines[i].trim() == "") {
                        lines[i] = "[CROCODOCS_EMPTY]"
                    }
                }
            }

            let originalLines = ""

            for(let i = 0; i < lines.length; i++) {
                if(lines[i] != "[CROCODOCS_EMPTY]") {
                    originalLines += lines[i]

                    if(i != lines.length - 1) {
                        originalLines += "\n"
                    }
                }
            }

            fs.writeFileSync(file.path, originalLines, 'utf-8')
        //}

        if(file.nextFile != null) {
            readFileErase(file.nextFile)
        } else {
            const chalk = require('chalk')

            console.log(chalk.default.yellow("\nErase all operation is done!\n"))
        }
    })
}

function createReplace() {
    fs.removeSync('crocodocs/documentation')

    create()
}