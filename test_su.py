import pty
import os
import time

def check_password(user, password):
    pid, fd = pty.fork()
    if pid == 0:
        os.execv('/bin/su', ['su', '-', user, '-c', 'exit 0'])
    else:
        time.sleep(0.5)
        try:
            output = os.read(fd, 1024)
            if b':' in output or b'assword' in output:
                os.write(fd, password.encode() + b'\n')
        except Exception:
            pass
            
        _, status = os.waitpid(pid, 0)
        return os.WEXITSTATUS(status) == 0

print(check_password("root", "wrongpassword"))
