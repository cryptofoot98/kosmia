# expands temple.src.css (@@ = a selector prefix strong enough to beat the older, !important rules) into public/temple.css
import re,sys
src=open('tools/temple.src.css',encoding='utf8').read()
out=src.replace('@I','html body.tp.tp.tp[data-tone=ink] #app').replace('@@','html body.tp.tp.tp #app').replace('@R','html body.tp.tp.tp #app').replace('@N','html body.tp.tp.tp #nav#nav')
open('public/temple.css','w',encoding='utf8').write('/* generated from tools/temple.src.css by tools/temple-build.py; edit the source */\n'+out)
print(len(out))
