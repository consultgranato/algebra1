"""Verify graph source coordinates and renderer samples with independent SymPy algebra."""
import json,subprocess,re
from pathlib import Path
import sympy as s
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,convert_xor
root=Path(__file__).resolve().parent.parent
items=json.loads(subprocess.check_output(['node',str(root/'scripts/graph-data.cjs')],text=True,encoding='utf8'))
x,y=s.symbols('x y')
def parse(t):return parse_expr(t,transformations=standard_transformations+(implicit_multiplication_application,convert_xor))
def difference(expr):
    a,b=re.split(r'<=|>=|=|<|>',expr)
    return parse(a)-parse(b)
points=0;probes=0
for item in items:
    relations=[difference(e) for e in item['expressions']]
    for px,py in item.get('points',[]):
        assert any(abs(float(r.subs({x:px,y:py})))<1e-8 for r in relations),(item['id'],px,py)
        points+=1
    for probe in item['probes']:
        residual=float(difference(probe['expression']).subs({x:probe['x'],y:probe['y']}))
        assert abs(residual)<1e-8,(item['id'],probe,residual)
        probes+=1
# Independently recalculate the highest-impact repaired word problems.
assert s.solve([42*x+12*y-120,x+y-5],(x,y))=={x:2,y:3}
assert s.solve([4*x+6*y-44,x+y-8],(x,y))=={x:2,y:6}
assert s.solve([4*x-y-6,-4*x+3*y-2],(x,y))=={x:s.Rational(5,2),y:4}
assert round(50*1.3**4)==143
assert round(80000*.98**5)==72314
assert s.expand(2*(x-1)*(x-5))==2*x*x-12*x+10
print(json.dumps({'assessmentGraphs':len(items),'markedCoordinates':points,'independentCurveSamples':probes,'wordProblemAndFactoredFormChecks':6,'failures':[]},indent=2))
