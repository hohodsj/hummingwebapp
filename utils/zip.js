module.exports.zip= rows=>{
    if(rows[0] && rows[0].length > 1) 
        return rows[0].map((_,c)=>rows.map(row=>row[c]))
    return [rows]
}
// module.exports.zip