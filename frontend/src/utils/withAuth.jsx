import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
const withAuth = (wrappedComponent) => {
    const AuthenticatedComponent = (props) => {
        const router = useNavigate();

        const isAuthenticated = () => {
            if(localStorage.getItem('token')){
                return true;
            }
            return false;
        }

         useEffect(() => {
            if (!isAuthenticated()) {
                router('/auth');
            }
        }, []);

        return <wrappedComponent {...props} />;
    };

    return AuthenticatedComponent;
}
export default withAuth;