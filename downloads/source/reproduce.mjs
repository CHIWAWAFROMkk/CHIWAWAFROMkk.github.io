import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {parseCSV,analyze,VERSION} from './analysis-core.mjs';
try {
 const [filename,...flags]=process.argv.slice(2);
 if(!filename||flags.some(x=>!['--dedupe','--drop-missing'].includes(x))) throw Error('用法: node reproduce.mjs file.csv [--dedupe] [--drop-missing]');
 const input=new TextDecoder('utf-8',{fatal:true}).decode(readFileSync(filename));
 const data=parseCSV(input), options={deduplicate:flags.includes('--dedupe'),dropMissing:flags.includes('--drop-missing')};
 const {rows,...result}=analyze(data,options);
 console.log(JSON.stringify({version:VERSION,inputSha256:createHash('sha256').update(input).digest('hex'),options,outputRows:rows.length,...result},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
