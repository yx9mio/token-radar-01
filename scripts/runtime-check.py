from pathlib import Path
import subprocess,time,json,hashlib,shutil
root=Path.cwd();results=[]
for name in ['a','b']:
 dest=root/'runs'/name
 if dest.exists(): shutil.rmtree(dest)
 dest.mkdir(parents=True)
 cmd=['docker','run','--name','strata-run-'+name,'--user','1000:1000','--network','none','--read-only','--cpus','1','--memory','1024m','--memory-swap','1024m','--pids-limit','64','--cap-drop','ALL','--security-opt','no-new-privileges','-v',str(root)+':/bot:ro','-v',str(root/'input')+':/input:ro','-v',str(dest)+':/output','-w','/bot','node:22-bookworm-slim','node','main.ts']
 t=time.monotonic();p=subprocess.run(cmd,capture_output=True,text=True,timeout=120);elapsed=time.monotonic()-t
 inspect=json.loads(subprocess.check_output(['docker','inspect','strata-run-'+name]))[0]
 results.append({'name':name,'exit_code':p.returncode,'wall_seconds_including_container':elapsed,'stdout':p.stdout,'stderr':p.stderr,'oom_killed':inspect['State']['OOMKilled'],'limits':{k:inspect['HostConfig'][k] for k in ['NetworkMode','ReadonlyRootfs','NanoCpus','Memory','MemorySwap','PidsLimit']}})
 if p.returncode: raise RuntimeError(p.stderr)
 subprocess.run(['docker','rm','strata-run-'+name],check=True,capture_output=True)
def hashes(d): return {str(p.relative_to(d)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(d.rglob('*')) if p.is_file()}
a,b=hashes(root/'runs/a'),hashes(root/'runs/b');assert a==b
results={'runs':results,'byte_identical':True,'hashes':a,'output_bytes':sum(p.stat().st_size for p in (root/'runs/a').rglob('*') if p.is_file())}
(root/'reports/runtime.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
