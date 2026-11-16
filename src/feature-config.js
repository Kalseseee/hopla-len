export function featuresFor(id){
 if(id==='medium')return{fall:[84,100],ice:[284,304],ramp:[304,312,1.2],boosts:[298],springs:[[104,2],[364,-2]],rain:[138,164],gloves:[196,204]};
 if(id==='hard')return{fall:[172,188],ice:[328,348],ramp:[340,348,1.35],boosts:[338],springs:[[64,1.8],[280,-1.8]],rain:[228,254],gloves:[96,104]};
 return null;
}
