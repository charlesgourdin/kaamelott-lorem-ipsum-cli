#! /usr/bin/env node

import chalk from 'chalk';
import clipboardy from 'clipboardy'
import { Command } from 'commander';
import * as figlet from 'figlet'
import { promises } from 'fs';
import * as path from 'path'
import { Options } from './models'


const program = new Command();

program
    .version("1.0.0")
    .description("A lorem ipsum generator")
    .option("-w, --word [number]", "Get a number of words")
    .option("-s, --sentence [number]", "Get a number of sentences")
    .option("-p, --paragraph [number]", "Get a number of paragraphs")
    .parse(process.argv);

const options: Options = program.opts();

function shuffleArray(array: string[]): string[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

async function getQuotes(): Promise<string[]> {
    const quotesPath = path.join(__dirname + '/assets/quotes.txt')
    
    try {
        const data = await promises.readFile(quotesPath)
        const quotes = data.toString('utf-8').split('[split-here]')

        return shuffleArray(quotes.slice(0, 100))
    } catch (error) {
        return Promise.reject(error)
    }
}

function countWords(str: string): number {
    const regex = /[^\w\s]/g;
    const sanitizedStr = str.replace(regex, "");
    const words = sanitizedStr.split(/\s+/);
    return words.length;
}

function truncateWords(str: string, numWords: number): string {
    const regex = /[^\w\s]/g;
    const words = str.split(/\s+/);
    let wordCount = 0;
    let truncatedStr = "";

    for (const word of words) {
        const sanitizedWord = word.replace(regex, "");
        if (sanitizedWord !== "") {
            truncatedStr += word + " ";
            wordCount++;
        }
        if (wordCount === numWords) {
            break;
        }
    }

    truncatedStr = truncatedStr.trim();

    if (str.length > 0 && /[^\w\s]/.test(str[str.length - 1])) {
        truncatedStr += str[str.length - 1];
    }

    return truncatedStr;
}

function removeNonAlphanumericStart(text: string): string {
    return text.replace(/^[^\wçÇ]+/, "");
}

function countSentences(str: string): number {
    const regex = /[^.?!;]+[.?!;]/g;
    const phrasesList = str.match(regex) || [];
    return phrasesList.length
}

function extractSentences(str: string, count: number): string {
    const regex = /(?<=[.;?!])\s*(?=\S)/;
    return str
        .split(regex)
        .slice(0, count)
        .reduce((acc, value) => {
            return acc += ['.', '!', '?'].includes(value) ? `${value}` : ` ${value}`
        }, '');
}

async function getWords(count: number): Promise<string> {
    let result = ''
    try {
        const quotes = await getQuotes()
        
        while (countWords(result) <= count) {
            result += quotes.shift()
        }
        return truncateWords(result, count)
    } catch (error) {
        return Promise.reject(error)
    }
}

async function getSentences(count: number): Promise<string> {
    let result = ''
    try {
        const quotes = await getQuotes()
        
        while (countSentences(result) <= count) {
            result += quotes.shift()
        }

        return removeNonAlphanumericStart((extractSentences(result, count)))
    } catch (error) {
        return Promise.reject(error)
    }
}

async function getParagraphs(count: number): Promise<string> {
    let result = []
    try {
        while (result.length < count) {
            const paragraph = await getSentences(10)
            result.push(paragraph)
        }

        return result.join('\n\n')
    } catch (error) {
        return Promise.reject(error)
    }
}

async function generateLoremIpsum() {
    const {word, sentence, paragraph} = options

    let lorem = ""

    try {
        if (word) {
            const count = Number(word)
            lorem += await getWords(count)
        } else if (sentence) {
            const count = Number(sentence)
            lorem += await getSentences(count)
        } else if (paragraph) {
            const count = Number(paragraph)
            lorem += await getParagraphs(count)
        } else {
            [lorem] = await getQuotes()
        }

        console.log("\n")
        console.log(chalk.bgRedBright.bold(figlet.textSync("Kaamelott Lorem Ipsum")));
        console.log("\n")
        console.log(chalk.dim(lorem))

        clipboardy.writeSync(lorem)

        console.log("\n")
        console.log("👑 ", (chalk.bgRedBright.bold("Copié dans le presse papier!")))
        console.log("\n")

    } catch (error) {
        console.log(error)
    }
}

generateLoremIpsum()