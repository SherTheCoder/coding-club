export function GraphArt({small=false}:{small?:boolean}) {
  const nodes=[[48,141],[127,46],[263,45],[357,140],[272,235],[125,229],[202,141]];
  const edges=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[1,6],[3,6],[4,6]];
  return <svg className={small?'graph-art small':'graph-art'} viewBox="0 0 410 285" fill="none" role="img" aria-label="Graph with seven connected nodes">
    <circle cx="201" cy="141" r="119" stroke="#91a769" strokeDasharray="2 9" opacity=".3"/>
    {edges.map(([a,b],i)=><path key={i} d={`M${nodes[a][0]} ${nodes[a][1]}L${nodes[b][0]} ${nodes[b][1]}`} stroke="#99ad74" strokeWidth="1.5"/>)}
    {nodes.map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={i===6?30:22} fill={i===6?'#d7f37f':'#293522'} stroke={i===6?'#d7f37f':'#839d5c'} strokeWidth="1.5"/><circle cx={x} cy={y} r={i===6?23:16} stroke={i===6?'#8eaa51':'#536c39'} strokeWidth=".6"/><text x={x} y={y+4} textAnchor="middle" fill={i===6?'#27371a':'#c4d8a3'} fontFamily="monospace" fontSize="10">{String(i+1).padStart(2,'0')}</text></g>)}
  </svg>;
}
export function ProblemArt({kind='islands'}:{kind?:string}) {
  return <svg viewBox="0 0 280 136" className={'problem-art '+kind} aria-hidden="true">
    {kind==='islands'?<>{Array.from({length:5},(_,y)=>Array.from({length:8},(_,x)=><rect key={x+'-'+y} x={50+x*23} y={15+y*22} width="18" height="17" rx="4" fill={[[0,0],[1,0],[0,1],[1,1],[3,2],[3,3],[5,3],[6,3],[6,4],[7,4]].some(([a,b])=>a===x&&b===y)?'#557b60':'#d8e7dc'}/>))}<path d="M54 19l-9-8m124 102 6 10" stroke="#7b9b78"/></>:kind==='oranges'?<>{Array.from({length:3},(_,y)=>Array.from({length:4},(_,x)=><g key={x+'-'+y}><circle cx={91+x*34} cy={34+y*34} r="12" fill={x+y<3?'#e68c43':'#f7c98d'}/><path d={`M${92+x*34} ${23+y*34}q4-7 9-4`} stroke="#7a8850" strokeWidth="2"/></g>))}<circle cx="91" cy="34" r="19" fill="none" stroke="#bc783f" strokeDasharray="3 4"/></>:kind==='clone'?<>{[0,120].map((offset,i)=><g key={i} transform={`translate(${offset} 0)`}><path d="M51 38h58v58H51z" fill="none" stroke={i?'#979bc0':'#6b7098'} strokeWidth="2"/>{[[51,38],[109,38],[109,96],[51,96]].map(([x,y],n)=><g key={n}><circle cx={x} cy={y} r="15" fill={i?'#dedff2':'#a7afd3'}/><text x={x} y={y+4} textAnchor="middle" fontSize="10" fill="#494e75" fontFamily="monospace">{n+1}</text></g>)}</g>)}<path d="M133 65h15m-5-5 5 5-5 5" fill="none" stroke="#737799"/></>:<><path d="M58 68h67m24 0h68M65 65l50-32 60 32M146 76l50 35" stroke="#527d74" strokeWidth="2" fill="none"/>{[[55,68],[126,30],[142,68],[213,68],[202,107]].map(([x,y],i)=><g key={i}><rect x={x-15} y={y-13} width="30" height="26" rx="6" fill={i===2?'#426c62':'#b8d0c6'}/><text x={x} y={y+4} fontSize="11" textAnchor="middle" fill={i===2?'white':'#41675c'} fontFamily="monospace">{i}</text></g>)}</>}
  </svg>;
}
