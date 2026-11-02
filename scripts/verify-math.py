"""Independent oracle: SymPy solves authored questions, not the browser grader.
Run: python scripts/verify-math.py (SymPy 1.14.0 required).
Unsupported prose/graph questions are counted as unverified, never passed.
"""
import json,re,subprocess,html
import sympy as s
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,convert_xor
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
data=json.loads(subprocess.check_output(['node',str(ROOT/'scripts/content.cjs')],text=True,encoding='utf8'))
def parse(t):
    t=html.unescape(re.sub(r'<sup>(.*?)</sup>',r'^(\1)',t))
    t=re.sub(r'<\/?(?:span|strong|em|b|i)[^>]*>','',t)
    t=t.replace('−','-').replace('×','*').replace('·','*').replace('²','^2').replace('³','^3')
    t=re.sub(r'(\S+)\s+(?:÷|/)\s+(\S+)',r'(\1)/(\2)',t)
    t=re.sub(r'√(\d+)',r'sqrt(\1)',t)
    return parse_expr(t,transformations=standard_transformations+(implicit_multiplication_application,convert_xor),evaluate=True)
def rel(t):
    p=re.split(r'(<=|>=|<|>)',t.replace('≤','<=').replace('≥','>='))
    if len(p)!=3:raise ValueError()
    return {'<':s.Lt,'>':s.Gt,'<=':s.Le,'>=':s.Ge}[p[1]](parse(p[0]),parse(p[2]))
counts={'equations':0,'inequalities':0,'expressions':0};failures=[];unverified=[];fixtures=[]
def typed(value):return s.sstr(value).replace('**','^')
for unit in data:
    groups=list(unit['banks'].items())+[('test',unit['test'])]
    for group,bank in groups:
        for i,p in enumerate(bank):
            eq=p.get('eq','');ans=p['a'];question=p['q'];kind=None
            ident=f"{unit['file']}:{group}:{i+1}"
            try:
                x=s.Symbol('x')
                if re.match(r'\s*x\s*=',ans) and eq.count('=')==1 and not any(c in eq for c in '<>≤≥'):
                    l,r=map(parse,eq.split('='));expr=l-r
                    if expr.free_symbols!={x}:raise ValueError()
                    values=[parse(v.strip().removeprefix('x').lstrip(' =')) for v in re.split(r'\s+or\s+|,',ans)]
                    expected=s.solveset(expr,x,domain=s.S.Reals)
                    actual=s.FiniteSet(*values)
                    kind='equations';ok=expected==actual
                    student=','.join('x='+typed(v) for v in expected)
                    wrong=','.join('x='+typed(v+1) for v in expected)
                elif question=='Solve:' and any(c in eq for c in '<>≤≥'):
                    expected=s.solve_univariate_inequality(rel(eq),x,relational=False)
                    actual=s.solve_univariate_inequality(rel(ans),x,relational=False)
                    kind='inequalities';ok=expected==actual
                    if isinstance(expected,s.Interval):
                        if expected.start is s.S.NegativeInfinity:
                            sign='<' if expected.right_open else '<='
                            student='x'+sign+typed(expected.end);wrong='x'+sign+typed(expected.end+1)
                        else:
                            sign='>' if expected.left_open else '>='
                            student='x'+sign+typed(expected.start);wrong='x'+sign+typed(expected.start+1)
                    else:raise ValueError()
                elif re.search(r'^(simplify|factor(?: out the gcf)?|multiply|divide|add|subtract):',question,re.I) and eq and '=' not in eq+ans:
                    l,r=parse(eq),parse(ans)
                    if any(len(str(v))>1 for v in l.free_symbols|r.free_symbols):raise ValueError()
                    kind='expressions';ok=s.simplify(l-r)==0
                    solution=s.factor(l) if p.get('answerForm') in ('factored','gcf') else s.expand(l)
                    student=typed(solution);wrong=typed(solution+1)
                else:raise ValueError()
                counts[kind]+=1
                if not ok:failures.append({'id':ident,'question':eq,'answer':ans,'expected':str(expected) if kind!='expressions' else str(s.expand(l))})
                else:fixtures.append({'id':ident,'input':student,'wrong':wrong,'key':ans,'policy':p})
            except (ValueError,TypeError,SyntaxError,NotImplementedError,AttributeError,NameError):
                unverified.append(ident)
runtime=json.loads(subprocess.check_output(['node',str(ROOT/'scripts/check-oracle.cjs')],input=json.dumps(fixtures),text=True,encoding='utf8'))
report={'checked':counts,'checkedTotal':sum(counts.values()),'unverifiedTotal':len(unverified),'failures':failures,'graderAgainstIndependentSolutions':runtime}
print(json.dumps(report,indent=2))
if failures or runtime['failures']:raise SystemExit(1)
