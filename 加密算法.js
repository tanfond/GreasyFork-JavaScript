const key = (() => {
    // 新方案定义私有变量。修复部分浏览器不支持 # 定义private私有变量
    const password = Symbol();

    class key {
        // _pwd;        // 火狐v68版本貌似不支持这种方式声明变量。

        constructor(pwd = null) {
            let num = 7, charCode, key = 7;
            if (pwd) {
                if (typeof pwd === "string") {
                    for (let i = 0; i < pwd.length; i++) {
                        charCode = pwd[i].charCodeAt()
                        key += parseInt(charCode.toString()[0]);
                        // num += charCode - 31
                        num += (charCode + 65505) % 65536;
                    }
                } else if (typeof pwd === "number") {
                    num += parseInt(Math.abs(pwd));
                } else {
                    console.error("Unsupported type '" + (typeof pwd) + "'. It only supports 'string' or 'numbers'.")
                }
            }
            this[password] = key.toString(8)[0] + num.toString();
        }

        encrypt(string) {
            if (string) {
                let subStart = string.length, subIndex = parseInt(this[password][0]) + 3, encryptPool = [], result = "";
                let stringKey = (subStart + parseInt(this[password].substring(1))) % 65536;
                let stringKeyFloat = 65536 / stringKey, stringKeyIndex = stringKey - 1;
                while (subStart > subIndex) {
                    subStart -= subIndex;
                    encryptPool.push(string.substr(subStart, subIndex));
                }
                encryptPool.push(string.substring(0, subStart));
                for (let i = 0, j; i < subIndex; i++) {
                    for (j = 0; j < encryptPool.length; j++) {
                        let char = encryptPool[j][i];
                        if (char) {
                            result += String.fromCharCode((char.charCodeAt() + parseInt(stringKeyFloat * (stringKeyIndex % 2 === 0 ? stringKeyIndex : stringKey - stringKeyIndex))) % 65536);
                            stringKeyIndex = stringKeyIndex === 0 ? stringKey - 1 : stringKeyIndex - 1;
                        } else {
                            break;
                        }
                    }
                }
                return result;
            } else {
                return "";
            }
        }

        /* 假设有7个字符

         加密前 - 排列
         ( 1 )  ( 2  3 )  ( 4  5 ) ( 6  7 )

         加密中 - 排列
         ︵   ︵   ︵    ︵
         6    4    2    1
         7    5    3    ︶
         ︶   ︶   ︶
         加密后 - 排列
         ( 6  4  2  1 )  ( 7  5  3 )

         解密中 - 排列
         ︵   ︵
         6    7
         4    5
         2    3
         1    ︶
         ︶
         解密后 - 排列
         1  2  3  4  5  6  7  8
        */

        decrypt(string) {
            if (string) {
                let subStart = 0, desubIndex = Math.ceil(string.length / (parseInt(this[password][0]) + 3)),
                    NullCount = string.length % (parseInt(this[password][0]) + 3), decryptPool = [], result = "";
                let stringKey = (string.length + parseInt(this[password].substring(1))) % 65536,
                    stringKeyFloat = 65536 / stringKey, stringKeyIndex;
                while (string.length - subStart > desubIndex) {
                    decryptPool.push(string.substr(subStart, desubIndex));
                    subStart += desubIndex;
                    if (decryptPool.length === NullCount) {
                        desubIndex--;
                    }
                }
                decryptPool.push(string.substring(subStart));
                for (let j = decryptPool[0].length - 1, i; j > -1; j--) {
                    NullCount = 0;
                    for (i = 0; i < decryptPool.length; i++) {
                        let char = decryptPool[i][j];
                        if (char) {
                            NullCount += decryptPool[i].length;
                            stringKeyIndex = NullCount - decryptPool[i].length + j + 1;
                            stringKeyIndex = (stringKey - stringKeyIndex % stringKey) % stringKey;
                            result += String.fromCharCode((char.charCodeAt() - parseInt(stringKeyFloat * (stringKeyIndex % 2 === 0 ? stringKeyIndex : stringKey - stringKeyIndex)) + 65536) % 65536);
                        }
                    }
                }
                return result;
            } else {
                return "";
            }
        }

        static ENCRYPT() {
            if (arguments) {
                let strings = [], keys = [];
                for (let i = 0; i < arguments.length; i++) {
                    // JavaScript如何用最简单的方法获取任意对象的类名？(包括自定义类) 判断对象类型？
                    // 欢迎支持我的原创文档 https://blog.csdn.net/qq_37759464/article/details/121764755
                    if (arguments[i].constructor.name === "key") {
                        keys.push(arguments[i]);
                    } else if (arguments[i].constructor.name === "String") {
                        strings.push(arguments[i]);
                    }
                }
                if (strings) {
                    if (keys) {
                        for (let i = 0, j; i < strings.length; i++) {
                            for (j = 0; j < keys.length; j++) {
                                strings[i] = i % 2 === 0 ? keys[j].encrypt(strings[i]) : keys[j].decrypt(strings[i]);
                            }
                        }
                        return strings.length === 1 ? strings[0] : strings;
                    } else {
                        keys[0] = new key();
                        // 为了使加密方法不一样，这里反过来
                        strings[i] = keys[0].decrypt(keys[0].decrypt(strings[i]));
                        return strings.length === 1 ? strings[0] : strings;
                    }
                }
            }
        }

        static DECRYPT() {
            if (arguments) {
                let strings = [], keys = [];
                for (let i = 0; i < arguments.length; i++) {
                    if (arguments[i].constructor.name === "key") {
                        keys.push(arguments[i]);
                    } else if (arguments[i].constructor.name === "String") {
                        strings.push(arguments[i]);
                    }
                }
                if (strings) {
                    if (keys) {
                        for (let i = 0, j; i < strings.length; i++) {
                            for (j = keys.length - 1; j > -1; j--) {
                                strings[i] = i % 2 === 0 ? keys[j].decrypt(strings[i]) : keys[j].encrypt(strings[i]);
                            }
                        }
                        return strings.length === 1 ? strings[0] : strings;
                    } else {
                        keys[0] = new key();
                        keys[1] = new key();
                        strings[i] = keys[0].encrypt(keys[0].encrypt(strings[i]));
                        return strings.length === 1 ? strings[0] : strings;
                    }
                }
            }
        }
    }

    return key;
})();
