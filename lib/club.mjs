export const MEMBERS = ['Himanish','Akashdeep','Ishan','Sarthak','Siddharth','Jatin','Sher Amir'];
export const TOPICS = ['Graphs','Trees','Dynamic programming','Arrays','Strings'];
export const SUGGESTIONS = [
  {title:'Number of Islands',url:'https://leetcode.com/problems/number-of-islands/',number:200,difficulty:'Medium',topic:'Graphs',pattern:'DFS · Grid traversal',art:'islands',prep:'Know how a visited set works and how to explore four neighboring cells.'},
  {title:'Clone Graph',url:'https://leetcode.com/problems/clone-graph/',number:133,difficulty:'Medium',topic:'Graphs',pattern:'BFS · Hash map',art:'clone',prep:'Review adjacency lists, BFS or DFS, and the difference between a reference and a deep copy.'},
  {title:'Rotting Oranges',url:'https://leetcode.com/problems/rotting-oranges/',number:994,difficulty:'Medium',topic:'Graphs',pattern:'Multi-source BFS',art:'oranges',prep:'Review queues and level-by-level breadth-first search.'},
  {title:'Course Schedule',url:'https://leetcode.com/problems/course-schedule/',number:207,difficulty:'Medium',topic:'Graphs',pattern:'Topological sort',art:'course',prep:'Review directed graphs, indegrees, and what a cycle means.'}
];

export function upcomingSessions(now = new Date(), count = 8) {
  const ist = new Date(now.getTime()+330*60000);
  const cursor = new Date(Date.UTC(ist.getUTCFullYear(),ist.getUTCMonth(),ist.getUTCDate()));
  if(ist.getUTCHours()>=20) cursor.setUTCDate(cursor.getUTCDate()+1);
  const dates=[];
  while(dates.length<count) {
    if([2,4].includes(cursor.getUTCDay())) dates.push(cursor.toISOString().slice(0,10));
    cursor.setUTCDate(cursor.getUTCDate()+1);
  }
  return dates;
}

export function isOpenSession(date,now=new Date()) { return upcomingSessions(now).includes(date); }
export function sessionLabel(date,short=false) {
  return new Date(date+'T12:30:00Z').toLocaleDateString('en-GB',{weekday:short?'short':'long',day:'numeric',month:short?'short':'long',timeZone:'Asia/Kolkata'});
}
export function problemLink(value,optional=false) {
  if(optional && !value) return '';
  let url;
  try {url=new URL(String(value).trim());} catch {throw new Error('Paste a valid LeetCode problem link.');}
  if(url.protocol!=='https:' || !['leetcode.com','www.leetcode.com'].includes(url.hostname) || url.username || url.password || url.port) throw new Error('Use an HTTPS link from leetcode.com.');
  const match=url.pathname.match(/^\/problems\/([a-z0-9-]+)(?:\/.*)?$/);
  if(!match) throw new Error('Use a LeetCode problem link, such as leetcode.com/problems/clone-graph/.');
  return 'https://leetcode.com/problems/'+match[1]+'/';
}
export function titleFromLink(value) {
  try {return new URL(value).pathname.split('/')[2].split('-').map(w=>w[0]?.toUpperCase()+w.slice(1)).join(' ');} catch {return '';}
}
export function validateQuestion(value) {
  const url=problemLink(value.url);
  const title=String(value.title||titleFromLink(url)).trim();
  const prep=String(value.prep||'').trim();
  const practice=problemLink(value.practice,true);
  if(title.length<2 || title.length>120) throw new Error('Give your problem a title of 2–120 characters.');
  if(prep.length>2000) throw new Error('Keep preparation notes under 2,000 characters.');
  if(!['Easy','Medium','Hard'].includes(value.difficulty)) throw new Error('Choose a difficulty.');
  if(!TOPICS.includes(value.topic)) throw new Error('Choose a topic.');
  return {url,title,prep,practice,difficulty:value.difficulty,topic:value.topic};
}
export function calendarEvent(date) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid date');
  const d=date.replaceAll('-','');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Coding Club//Sessions//EN','BEGIN:VEVENT','UID:'+date+'@coding-club','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),'DTSTART:'+d+'T123000Z','DTEND:'+d+'T143000Z','SUMMARY:Coding Club','DESCRIPTION:LeetCode session. Review the posted questions and prep.','BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY','DESCRIPTION:Coding Club starts in 30 minutes','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
}
