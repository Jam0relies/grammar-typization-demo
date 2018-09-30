(function () {
    "use strict";
    class Rule {
        leftPart: Array<String>;
        rightParts: Array<Array<String>>;
        constructor(left: Array<String>, rights: Array<Array<String>>) {
            this.leftPart = left;
            this.rightParts = rights;
        }

        public toString() {
            return [...this.leftPart, '->', this.rightParts.map(x => x.join('')).join('|')].join('');
        }
    }

    class Grammar {
        terminals: Set<String>;
        nonterminals: Set<String>;
        rules: Array<Rule>;
        startSymbol: String;
        emptyChainSymbol: String;
        constructor(terminals: Set<String>, nonterminals: Set<String>, rules: Array<Rule>, startSymbol: String,
            emptyChainSymbol: String) {
            this.terminals = terminals;
            this.nonterminals = nonterminals;
            this.rules = rules;
            this.startSymbol = startSymbol;
            this.emptyChainSymbol = emptyChainSymbol;
        }

        is0Type(): boolean {
            return this.rules.every(rule => {
                return rule.leftPart.every(symbol => { return this.hasSymbol(symbol) }) &&
                    rule.leftPart.some(symbol => { return this.nonterminals.has(symbol) }) &&
                    rule.rightParts.every(rightPart => rightPart.every(symbol => { return this.hasSymbol(symbol) }))
            });
        }
        is1Type(): boolean {
            return this.rules.every(rule => {
                if (rule.leftPart.every(symbol => { return this.hasSymbol(symbol) }) == false) {
                    return false;
                }
                let leftPart = rule.leftPart;
                let prefix: Array<String>;
                let postfix: Array<String>;
                for (let i = 0; i < leftPart.length; i++) {
                    if (this.nonterminals.has(leftPart[i])) {
                        prefix = leftPart.slice(0, i);
                        postfix = leftPart.slice(i + 1, leftPart.length);
                        if (rule.rightParts.some(rightPart => {
                            for (let j = 0; j < i; j++) {
                                if (rightPart[j] !== leftPart[j]) {
                                    return false;
                                }
                            }
                            for (let j = leftPart.length - i; i + j < leftPart.length; j++) {
                                if (rightPart[rightPart.length - j - 1] !== leftPart[leftPart.length - j - 1]) {
                                    return false;
                                }
                            }
                            return true;
                        })) {
                            return true;
                        }
                    }
                }
                return false;
            })
        }

        is2Type(): boolean {
            return this.rules.every(rule => {
                return rule.leftPart.length === 1 && this.nonterminals.has(rule.leftPart[0]) &&
                    rule.rightParts.every(rightPart => { return rightPart.every(symbol => { return this.hasSymbol(symbol) }); });
            });
        }

        isRightRegular(): boolean {
            return this.rules.every(rule => {
                return rule.leftPart.length === 1 && this.nonterminals.has(rule.leftPart[0]) &&
                    rule.rightParts.every(rightPart => {
                        return this.terminals.has(rightPart[0]) && (rightPart.length === 1 ||
                            (rightPart.length === 2 && this.nonterminals.has(rightPart[1])));
                    })
            });
        }

        isLeftRegular(): boolean {
            return this.rules.every(rule => {
                return rule.leftPart.length === 1 && this.nonterminals.has(rule.leftPart[0]) &&
                    rule.rightParts.every(rightPart => {
                        return (rightPart.length === 1 && this.terminals.has(rightPart[0])) ||
                            (rightPart.length === 2 && this.nonterminals.has(rightPart[0]) && this.terminals.has(rightPart[1]));
                    })
            });
        }


        hasNotEmptySymbol(symbol: String): boolean {
            return this.terminals.has(symbol) || this.nonterminals.has(symbol);
        }

        hasSymbol(symbol: String): boolean {
            // console.log(symbol);
            // console.log(this.terminals.has(symbol));
            // console.log(this.nonterminals.has(symbol));
            // console.log(symbol === this.emptyChainSymbol);
            return this.terminals.has(symbol) || this.nonterminals.has(symbol) || (symbol === this.emptyChainSymbol);
        }
    }



    var buttons = document.querySelectorAll('button');

    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', test);
    }

    function test() {
        //alert(document.getElementById('terminals').value);
        let terminals = parse((document.getElementById('terminals') as HTMLTextAreaElement).value);
        console.log("Терминалы: " + [...terminals].join(", "));
        let nonterminals = parse((document.getElementById('nonterminals') as HTMLTextAreaElement).value);
        console.log("Нетерминалы: " + [...nonterminals].join(", "));
        let rules = parseRules((document.getElementById('rules') as HTMLTextAreaElement).value);
        console.log("Правила вывода: " + [...rules].join('\n'));
        let startSymbol: String = (document.getElementById('startSymbol') as HTMLInputElement).value.trim();
        console.log(startSymbol);
        let emptyChainSymbol = (document.getElementById('emptyChainSymbol') as HTMLInputElement).value.trim();
        console.log(emptyChainSymbol);

        let grammar: Grammar = new Grammar(terminals, nonterminals, rules, startSymbol, emptyChainSymbol);
        let result: HTMLDivElement = (document.getElementById('result') as HTMLDivElement);
        let type = classify(grammar);
        console.log(type);
        result.textContent = 'Тип: ' + type[0] + " " + type[1];

    }
    function parse(text: String): Set<String> {
        return new Set(text.replace(/[\s]*/g, '').split(','));
    }

    function parseRules(text: String): Array<Rule> {
        return text.replace(/[ \t]*/g, '').split('\n').map((row: any) => { return parseRule(row); });
    }

    function parseRule(ruleString: String): Rule {
        let parts: Array<String> = ruleString.split('->');
        return new Rule(parts[0].split(''), parts[1].split('|').map((right: String) => right.replace(/[\s]*/g, '').split('')));
    }

    function classify(grammar: Grammar): Array<any> {
        let type = [NaN, ""]
        if (grammar.isLeftRegular()) {
            type[0] = 3;
            type[1] = "left regular";
            return type;
        }
        if (grammar.isRightRegular()) {
            type[0] = 3;
            type[1] = "right regular";
            return type;
        }
        if (grammar.is2Type()) {
            type[0] = 2;
            return type;
        }
        if (grammar.is1Type()) {
            type[0] = 1;
            return type;
        }
        if (grammar.is0Type()) {
            type[0] = 0;
            return type;
        }
        type[1] = "not formal";
        return type;
    }
})();