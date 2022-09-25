module.exports.zip= rows=>{
    if(rows[0] && typeof rows[0] === 'object' && rows[0].length > 1) 
        return rows[0].map((_,c)=>rows.map(row=>row[c]))
    return [rows]
}