UPGS.stardust = {
    unl: ()=>player.planetoid.active,

    title: "Stardust Upgrades",

    autoUnl: ()=>hasSolarUpgrade(0,13),
    noSpend: ()=>hasSolarUpgrade(0,13),

    req: ()=>player.grassjump>=30,
    reqDesc: ()=>`Reach 30 Grass-Jump to Unlock.`,

    underDesc: ()=>`You have ${format(player.stardust,0)} Stardust`+gainHTML(player.stardust,tmp.stardustGain,1),

    ctn: [
        {
            max: 1000,

            title: "Star Growth",
            desc: `Increase star grow speed by <b class="green">+5%</b> compounding per level.`,
        
            res: "stardust",
            icon: ["Curr/StarGrow"],
                        
            cost: i => Decimal.pow(1.15,i).mul(10).scale(1e33,3,2),
            bulk: i => i.scale(1e33,3,2,true).div(10).max(1).log(1.15).floor().add(1),
        
            effect(i) {
                let x = Decimal.pow(1.05,i)
        
                return x
            },
            effDesc: x => formatMult(x),
        },{
            max: 1000,

            title: "Stardust",
            desc: `Increase stardust generated by <b class="green">+15%</b> compounding per level.`,
        
            res: "stardust",
            icon: ["Curr/Stardust"],
                        
            cost: i => Decimal.pow(1.3,i).mul(25).scale(1e33,2,2),
            bulk: i => i.scale(1e33,2,2,true).div(25).max(1).log(1.3).floor().add(1),
        
            effect(i) {
                let x = Decimal.pow(1.15,i)
        
                return x
            },
            effDesc: x => formatMult(x),
        },{
            max: 1000,

            title: "Stardust XP",
            desc: `Increase the exponent of XP by <b class="green">+1%</b> per level.`,
        
            res: "stardust",
            icon: ["Icons/XP","Icons/Exponent"],
                        
            cost: i => Decimal.pow(2,i).mul(100),
            bulk: i => i.div(100).max(1).log(2).floor().add(1),
        
            effect(i) {
                let x = i/100+1
        
                return x
            },
            effDesc: x => formatPow(x),
        },{
            max: 1000,

            title: "Stardust Cosmic",
            desc: `Increase the exponent of Cosmic by <b class="green">+1%</b> per level.`,
        
            res: "stardust",
            icon: ["Icons/XP2","Icons/Exponent"],
                        
            cost: i => Decimal.pow(3,i).mul(1000),
            bulk: i => i.div(1000).max(1).log(3).floor().add(1),
        
            effect(i) {
                let x = i/100+1
        
                return x
            },
            effDesc: x => formatPow(x),
        },
    ],
}

function stardustGain() {
    let x = upgEffect('stardust',1)
    .mul(upgEffect('planetarium',4))
    .mul(upgEffect('astro',5))
    .mul(upgEffect('measure',5))
    .mul(upgEffect('planet',3))

    if (player.planetoid.planetTier>=40) x = x.mul(getPTEffect(5))

    x = x.mul(solarUpgEffect(3,0)).mul(solarUpgEffect(4,8)).mul(getASEff('sd'))

    return x
}

const THE_STAR = {
    get growSpeed() {
        let x = upgEffect('stardust',0,E(1))
        
        .mul(solarUpgEffect(4,0))
        .mul(solarUpgEffect(4,20))

        .mul(solarUpgEffect(5,2))
        .mul(solarUpgEffect(6,1))

        .mul(getFormingBonus('dark',1))

        return x
    },
    starGrowthReq: [E(1e7),E(1e10),E(1e13),E(1e20),E(1e27)],
    get getStarTier() {
        let t = 0
        while (player.stargrowth.gte(this.starGrowthReq[t]??EINF)) t++;
        t = E(t)
        if (t.gte(2)) t = t.min(player.sn.eclipse.div(10).root(3).add(2).floor())
        return t
    },
    get getStarTierRequirement() {
        let st = tmp.starTier
        return [this.starGrowthReq[st.toNumber()]??EINF, st.gte(2) ? st.sub(1).pow(3).mul(10) : E(0)]
    },
    get calcETA() {
        let gs = tmp.growSpeed, req = this.getStarTierRequirement[0]

        if (gs.lte(0) || req.gte(EINF)) return "Forever"

        return formatTime(req.sub(player.stargrowth).div(tmp.growSpeed).max(0),0)
    },
}

tmp_update.push(()=>{
    tmp.stardustGain = stardustGain()
    tmp.growSpeed = THE_STAR.growSpeed
    tmp.starTier = THE_STAR.getStarTier

    let sg = player.stargrowth
    
    for (let [i,x] of Object.entries(ADV_STAR)) if (x.bonus) tmp.starBonus[i] = x.bonus(sg)
})

el.update.star = ()=>{
    let d = player.planetoid.active && mapID == 'rp' && player.grassjump >= 30

    tmp.el.star_div.setDisplay(d)

    if (d) {
        tmp.el.star_tier.setHTML(tmp.starTier.format(0))

        tmp.el.stargrowth.setHTML(player.stargrowth.format(0))
        tmp.el.growspeed.setHTML(tmp.growSpeed.format()+"/s")

        let st_req = THE_STAR.getStarTierRequirement

        tmp.el.starnexttier.setHTML(`
        <span class="cyan">${st_req[0].format(0)}</span>, ETA: ${THE_STAR.calcETA}`+(st_req[1].gt(0) ? `, <span class="yellow">Eclipse ${st_req[1].format(0)}</span>` : ""))
    }

    if (mapID3 == 'adv' && player.world == 'star') {
        let s = player.sn.tier, done = false

        for (let [i,x] of Object.entries(ADV_STAR)) {
            i = parseInt(i)
            let el_id = 'sm'+i, unl = s.gte(i+5)

            tmp.el[el_id+"_div"].setDisplay(unl)

            if (!unl) continue;

            tmp.el[el_id+"_div"].setClasses({'star-milestone': true, achieved: s.gt(i+5)})

            let cur = s.eq(i+5), req = x.req

            tmp.el[el_id+"_bonus"].setHTML(x.bonusDesc?x.bonusDesc(tmp.starBonus[i]):"")
            tmp.el[el_id+"_req"].setHTML(`
            <b${cur && player.stargrowth.lt(req[0]) ? ' class="red"' : ''}>${(cur ? player.stargrowth.format(0) + " / " : "") + format(req[0],0)} Star Growth</b><br>
            <b${cur && player.sn.eclipse.lt(req[1]) ? ' class="red"' : ''}>${(cur ? player.sn.eclipse.format(0) + " / " : "") + format(req[1],0)} Eclipse</b><br>
            <b${cur && player.sol.mana.lt(req[2]) ? ' class="red"' : ''}>${(cur ? player.sol.mana.format(0) + " / " : "") + format(req[2],0)} Mana</b><br>
            `)

            if (cur) done = player.stargrowth.gte(req[0]) && player.sn.eclipse.gte(req[1]) && player.sol.mana.gte(req[2])
        }

        tmp.el.star_btn.setClasses({locked: !done})
        tmp.el.star_btn.setTxt(done?"Increase The Star!":"You didn't meet the requirement!")
    }
}

function increaseStar() {
    let s = player.sn.tier.toNumber(), x = ADV_STAR[s-5]

    if (x && player.stargrowth.gte(x.req[0]) && player.sn.eclipse.gte(x.req[1]) && player.sol.mana.gte(x.req[2])) {
        player.sn.tier = player.sn.tier.add(1)
    }
}

function getStarBonus(i,def=1) { return player.sn.tier.gte(i) ? tmp.starBonus[i-6] ?? def : def }

const ADV_STAR = [
    {
        req: [1e36,1250,1e6],
    },{
        req: [1e42,1500,1e18],
        bonus: x => x.div(1e40).max(1).pow(2),
        bonusDesc: x => `<b class='darkgreen'>${formatMult(x)}</b> Offense`,
    },{
        req: [1e51,5500,1e72],
        bonus: x => x.div(1e50).max(1).pow(2),
        bonusDesc: x => `<b class='darkgreen'>${formatMult(x)}</b> Collecting & Forming`,
    },{
        req: [1e58,12500,1e93],
        bonus: x => x.div(1e55).max(1).log10().root(2).div(10).add(1),
        bonusDesc: x => `<b class='darkgreen'>${formatPow(x)}</b> Line & Solar Flare`,
    },{
        req: [1e81,50000,1e220],
        bonus: x => expMult(x.div(1e80).add(1),0.5),
        bonusDesc: x => `<b class='darkgreen'>${formatMult(x)}</b> Divine Soul`
    }
]

el.setup.star = ()=>{
    let h = ``

    for (let [i,x] of Object.entries(ADV_STAR)) {
        i = parseInt(i)

        h += `
        <div class="star-milestone" id='sm${i}_div'>
            <div class="sm-tier">T${i+6}</div>
            <div class="sm-bonus" id='sm${i}_bonus'>x??? to something</div>
            <div class="sm-req" id='sm${i}_req'>
                ??? Star Growth<br>
                ??? Eclipse<br>
                ??? Mana<br>
            </div>
        </div>
        `
    }

    new Element('adv_star_table').setHTML(h)
}